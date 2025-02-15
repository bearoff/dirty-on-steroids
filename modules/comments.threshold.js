d3.addModule(
{
	type: "Содержание",
	name: 'Порог комментариев',
	author: 'bearoff',
	config: {active:{type:'checkbox',value:true, description:'Добавляет выпадающий список, который позволяет скрывать комментарии с низким рейтингом. Рейтинги в списке хитро рассчитываются для каждого поста индивидуально. Комментарии со спрятанным рейтингом показываются всегда.'}
            ,optionsCount:{type:'text',value:'10',caption:'Количество опций: ',description:'Cколько опций будет в ниспадающем меню. Когда комментариев в посте мало, опций может быть меньше, чем это значение.'}
            ,defaultOption:{type:'text',value:'0',caption:'Опция по умолчанию: ', description:'Какая опция применится сразу после того, как вы откроете пост.'}
            ,saveSelectedOption:{type:'checkbox',value :false,caption:'Использовать опцию, выбранную на странице, вместо умолчания', description:'Если поставить тут галочку, то вместо опции по умолчанию будет использоваться та опция, которую вы последний раз выбрали в ниспадающем меню.'}
            ,minCommentsCount:{type:'text',value:'10',caption:'Минимум комментариев для работы: ', description:'Если в посте будет меньше комментариев, чем значение этого параметра, трешхолд не появится на странице.'}
            ,alwaysShowRepliesToMe:{type:'checkbox',value :true,caption:'Не скрывать ответы мне', description:'Всегда показывать ответы на ваши комментарии. Ваши комментарии показываются всегда.'}
            ,expandCollapsedComments:{type:'checkbox',value :true,caption:'Разворачивать свёрнутые ветки', description:'Разворачивать свёрнутые ветки'}
			},
    threshold: 0,
    variant: ['dirty.ru','leprosorium.ru','reddit.com','habr.com'],
    select:null,
    min_rating:0,
    max_rating:0,
    selected_index:0,
    select_properties:{thresholds:[], selected_strings:[],counts:[]},
    sorted_comments:{},
    always_visible_count:0,
    hidden_rating_count:0,
    my_comments:{},
    visible_parents:{},
        run: function()
        {
            if (this.config.saveSelectedOption.value) {
                this.selected_index = d3.storage.get('commentsSelectedThreshold'); // todo ask about how to use hidden options
                if (!this.selected_index) {
                    this.selected_index = 0;
                }
            } else {
                this.selected_index = parseInt(this.config.defaultOption.value);
                if (this.selected_index < 0) {
                    this.selected_index = 0;
                }
            }

            this.addReinitListener();
            
            if (!d3.page.postComments
                || !d3.content.comments.length
                || d3.content.comments.length < parseInt(this.config.minCommentsCount.value))
            {
                return false;
            }

            if (this.config.expandCollapsedComments.value) {
                this.expandCollapsedComments();
            }
            this.getStats();
            this.prepareThresholds();
            this.updateVisibility(false);
            this.displaySelect();
        },

        displaySelect: function()
        {
            var me = this;
            var extra_style = "";
            if (d3.content.variant === "dirty.ru") {
                var header_div = $j(".p-post-item__toolbar:first");
                // fixing margins
                $j(".p-post-item__sorting").css("margin", "0 20px;");
            } else if (d3.content.variant === "leprosorium.ru") {
                header_div = $j("div.b-comments_controls");
            } else if (d3.content.variant === "reddit.com") {
                header_div = $j(".thing p.tagline:first");
            } else if (d3.content.variant === "habr.com") {
                header_div = $j(".tm-header-user-menu");
                extra_style = "font-size: 16px;"
            }

            let F_SELECT_FIXED_ON_TOP = true;

            if (F_SELECT_FIXED_ON_TOP) {
                var select_div = $j('<div id="advansed_treshhold_div" style="margin-left:5px;margin-right:5px; border-radius:4px;position: fixed; top: 5px; left: 10px; z-index: 10000;"></div>');
            } else {
                select_div = $j('<div id="advansed_treshhold_div" style="display:inline;margin-left:5px;margin-right:5px;border-radius:4px;"></div>');
            }

            var select_width = this.hidden_rating_count ? 200 : 180;
            this.select  = $j('<select id="advansed_treshhold" style="width:'+select_width+'px;'+extra_style+'"></select>');
            select_div.append(this.select);
            
            if (F_SELECT_FIXED_ON_TOP) {
                $j("body").append(select_div);
            } else if (d3.content.variant === "habr.com") {
                header_div.before(select_div);
            } else {
                header_div.append(select_div);
            }

            for (var i=0; i<this.select_properties.thresholds.length;i++) {
                var visible_count = this.always_visible_count + this.select_properties.counts[i];
                var hidden_part = this.hidden_rating_count ? (this.hidden_rating_count + '+') : '';
                if (this.hidden_rating_count) {
                    visible_count = visible_count - this.hidden_rating_count;
                }
                var option_title = i+': Больше ' + this.select_properties.thresholds[i] + " (" + hidden_part + visible_count +  ")";
                var option = $j('<option id="advthresh_'+i
                                    + '" value="'+this.select_properties.thresholds[i]
                                    + '" '+this.select_properties.selected_strings[i]+'>'
                                    + option_title
                                    + '</option>');
                this.select.append(option);
            }

            this.select.change(function(e){
                me.onThresholdChange();
            });

            if (d3.content.variant === "habr.com" && this.select_properties.thresholds.length) {
                // as after all those scrolls we may end up with no comments visible
                me.onThresholdChange();
            }
        },

        showWithParents: function(comment_container, callback, f_first_parent = false) {
            if (d3.content.variant === "habr.com") {
                comment_container = comment_container.find("> .content-list__item_comment");
                var parent_link = comment_container.find(".js-comment_parent");
                var parent_id = parent_link.length ? "comment_" + parent_link.data('parent_id') : "";
            } else if (d3.content.variant === "dirty.ru") {
                var parent = comment_container.parent().closest(".b-comment:not(#b-comment-root)");
                parent_id = parent.length ? parent.attr('id').replace("b-comment-", "") : '';
            } else {
                parent_id = comment_container.attr("data-parent_comment_id");
            }

            comment_container.show();

            let color = f_first_parent ? 'lightblue' : 'lightyellow';
            let highlight_timeout = f_first_parent ? 5000 : 35000;

            if (d3.content.variant === "leprosorium.ru") {
                var highlight_block = comment_container.find("> .c_i");
            } else {
                highlight_block = comment_container;
            }

            highlight_block.css('border', '1px solid grey').css('background', color);
            setTimeout(function(){
                highlight_block.css('background', 'none');
            }, highlight_timeout);

            if (!parent_id) {
                callback();
                return;
            }
            var parent = $j("#"+parent_id);
            this.showWithParents(parent, callback);
        },

        showChildren: function(comment_id) {
            if (d3.content.variant !== "leprosorium.ru") {
                // should not happen
                return;
            }

            var me = this;

            $j('[data-parent_comment_id="' + comment_id + '"]').each(function() {
                const comment_container = $j(this);
                const highlight_block = comment_container.find("> .c_i");
                comment_container.show();
                highlight_block.css('border', '1px solid grey').css('background', 'lightyellow');
                setTimeout(function(){
                    highlight_block.css('background', 'none');
                }, 35000);

                me.showChildren(comment_container.attr('id'));
            });
        },

        addChildrenLink: function(comment) {
            if (d3.content.variant !== "leprosorium.ru") {
                return;
            }

            if (!$j('[data-parent_comment_id="' + comment.id + '"]').length) {
                // no children
                return;
            }

            var me = this;
            var children_link = $j("<a class='d3sp_children_link' title='Show and highlight children' style='cursor: pointer; font-size: 13px; color: blue; padding: 3px 20px;'>&darr;</a>");
            comment.container.find(">.b-comment__body .b-comment-toolbar, .c_footer .ddi").append(children_link);

            children_link.click(function(){
                me.showChildren(comment.id);
            });

            children_link.hover(
                function() {$j(this).css('background-color', 'lightyellow')},
                function() {$j(this).css('background-color', 'transparent')}
            );
        },

        fixParentLink: function(comment) {
            var me = this;

            if (d3.content.variant !== "dirty.ru" && d3.content.variant !== "leprosorium.ru" && d3.content.variant !== "habr.com") {
                return;
            }

            if (!comment.parentId) {
                return;
            }

            var parent_link = $j("<a class='d3sp_parent_link' title='Show and highlight parents' style='cursor: pointer; font-size: 13px; color: blue; padding: 3px 20px;'>&uarr;</a>");
            comment.container.find(">.b-comment__body .b-comment-toolbar, .c_footer .ddi").append(parent_link);
            if (d3.content.variant === "dirty.ru") {
                var parent = $j("#b-comment-"+comment.parentId);
            } else if (d3.content.variant === "habr.com") {
                parent_link = comment.container.find(".tm-comment__icon");
                parent = comment.parentComment;
            } else {
                parent = $j("#"+comment.parentId);
            }

            parent_link.click(function(){
                me.showWithParents(parent, () => {
                    const MORE_SCROLL_SHIFT = 200;
                    var targetOffset = $j(parent).offset().top - MORE_SCROLL_SHIFT;
                    var currentScroll = $j(window).scrollTop();
                    if (currentScroll > targetOffset) {
                        $j('html, body').animate({ scrollTop: targetOffset }, 100);
                    };
                }, true);
            });

            parent_link.hover(
                function() {$j(this).css('background-color', 'lightyellow')},
                function() {$j(this).css('background-color', 'transparent')}
            );
        },

        getStats: function()
        {
            for (var i=0; i<d3.content.comments.length; i++) {
                var rating = d3.content.comments[i].ratingValue();
                this.fixParentLink(d3.content.comments[i]);
                this.addChildrenLink(d3.content.comments[i]);
                if (isNaN(rating) || null === rating) {
                    // may be deleted or with hidden rating
                    continue;
                }
                if (this.sorted_comments[rating]===undefined) {
                    this.sorted_comments[rating] = [];
                }
                this.sorted_comments[rating].push(i);

                if (this.min_rating > rating) {
                    this.min_rating = rating;
                }
                if (this.max_rating < rating) {
                    this.max_rating = rating;
                }
            }
        },

        prepareThresholds: function()
        {
            var comments_count = d3.content.comments.length;
            var rest_count = comments_count;
            var options_left = this.config.optionsCount.value;
            var curr_step = Math.floor(comments_count/options_left);

            var curr_i = -1;
            var curr_thresh_count = 0;
            var curr_thresh_value = null;

            for (var i=this.min_rating; i<=this.max_rating; i++) {
                if (this.sorted_comments[i]===undefined) {
                    continue;
                }
                if (curr_thresh_value===null) {
                    curr_thresh_value = i;
                }

                curr_thresh_count += this.sorted_comments[i].length;
                if (curr_thresh_count >= curr_step) {
                    curr_i++;
                    this.select_properties.counts[curr_i] = rest_count;
                    this.select_properties.thresholds[curr_i] = curr_thresh_value;
                    this.select_properties.selected_strings[curr_i] = '';
                    rest_count = rest_count-curr_thresh_count;
                    curr_thresh_count=0;
                    curr_thresh_value=null;
                    options_left--;
                    if (!options_left) {
                        break;
                    }
                    curr_step = Math.floor(rest_count/options_left);
                }
            }

            if (this.selected_index > curr_i) {
                // less options than selected
                this.selected_index = curr_i;
            }

            var MIN_SHOWN_COUNT = 6;
            for (var t = this.selected_index; t >= 0; t--) {
                // select another treshhold if the current one contains too small count of items
                if (this.select_properties.counts[t] >= MIN_SHOWN_COUNT) {
                    this.selected_index = t;
                    break;
                }
                console.log('curr trhreshold contains just ' + this.select_properties.counts[this.selected_index] + ' items, will lower');
            }

            this.select_properties.selected_strings[this.selected_index] = 'selected';
            this.threshold = this.select_properties.thresholds[this.selected_index];
        },

        updateCounts: function(rating_value, visible)
        {
            for (var i=0; i<this.select_properties.thresholds.length;i++) {
                if (visible || rating_value >= this.select_properties.thresholds[i]) {
                    this.select_properties.counts[i]++;
                } else {
                    return;
                }
            }
        },

        isReplyToMe: function(comment){
            return comment.parentId && this.my_comments[comment.parentId];
        },

        isVisible: function(comment)
        {
            if (comment.isMine) {
                this.always_visible_count++;
                this.my_comments[comment.id] = comment.id;
                return true;
            }
            if (this.config.alwaysShowRepliesToMe.value && this.isReplyToMe(comment)) {
                this.always_visible_count++;
                return true;
            }
            var rating = comment.ratingValue();
            if (rating === null) {
                this.hidden_rating_count++;
                return true;
            }
            if (rating >= this.threshold) {
                return true;
            }
            return false;
        },

        updateVisibility: function(first)
        {
            var show = function(item){item.css('display','block');};
            var hide = function(item){item.css('display','none');};
//            var hide = show;
            this.visible_parents = {};

            for (var i=0; i<d3.content.comments.length; i++) {
            	var comment = d3.content.comments[i];
                var isVisible = this.isVisible(comment);

                (isVisible ? show : hide)(comment.container);
                if (isVisible && comment.parentId) {
                    if (d3.content.variant === "reddit.com") {
                        this.visible_parents[comment.parentId.replace("#", "thing_t1_")] = true;
                    } else if (d3.content.variant === "dirty.ru" || d3.content.variant === "habr.com") {
                        this.visible_parents[comment.parentId] = true;
                    }
                }

                if (first) {
                    this.updateCounts(comment.ratingValue(), isVisible);
                }
            }

            if (d3.content.variant === "reddit.com") {
                for (var key in this.visible_parents) {
                    var comm = $j("#" + key);
                    if (!comm.is(":visible")) {
                        show(comm);
                        comm.removeClass("collapsed");
                        var parents = comm.parents();
                        parents.filter(".collapsed").removeClass("collapsed");
                        show(parents.filter(":not(:visible)"));
                    }
                }
            } else if (d3.content.variant === "dirty.ru") {
                for (var key in this.visible_parents) {
                    var comm = $j("#b-comment-" + key);
                    if (!comm.is(":visible")) {
                        show(comm);
                        var parents = comm.parents();
                        show(parents.filter(":not(:visible)"));
                    }
                }
            } else if (d3.content.variant === "habr.com") {
                for (var key in this.visible_parents) {
                    var comm = $j("#" + key);
                    if (!comm.is(":visible")) {
                        show(comm);
                        var parents = comm.parents();
                        show(parents.filter(":not(:visible)"));
                    }
                }
            }
            $j(document).trigger('d3sp_content_updated');
        },

        onThresholdChange: function()
        {
            this.selected_index = this.select.find(':selected').attr('id').split('_')[1];
            if (this.config.saveSelectedOption.value) {
                d3.storage.set('commentsSelectedThreshold', this.selected_index);
            }

            this.threshold = this.select.val();
            this.updateVisibility(false);
        },

        expandCollapsedComments: function() {
            $j('.b-comment__expand-button').each(function(){
                $j(this)[0].click();
            });
        },

        addReinitListener: function() {
            var me = this;
            $j(document).on('d3_sp_new_comments', function (event) {
                clearTimeout(me.reset_timeout);
                me.reset_timeout = setTimeout(function(){
                    me.resetFilter();
                }, 200);
            });
        },

        resetFilter: function(reset_link) {
            var me = this;

            me.threshold = 0;
            me.hidden_rating_count = me.always_visible_count = me.min_rating = me.max_rating = 0;
            me.select = null;
            me.select_properties = {thresholds:[], selected_strings:[], counts:[]};
            me.sorted_comments = this.my_comments = {};

            $j("#advansed_treshhold_div").remove();
            me.getStats();
            me.prepareThresholds();
            me.updateVisibility(false);
            me.displaySelect();

            var new_count = d3.content.comments.length;
            $j("#recount_btn").find("span").text(" (+" + new_count + ")").show().fadeOut(5000);
        }
});
