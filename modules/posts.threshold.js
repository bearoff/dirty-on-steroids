/* Mostly 1:1 copy-paste from comments threshold */
d3.addModule(
{
	type: "Содержание",
	name: 'Порог постов',
	author: 'bearoff',
	config: {active:{type:'checkbox',value:false, description:'Добавляет выпадающий список, который позволяет скрывать посты с низким рейтингом и небольшим количеством комментариев. Рейтинги в списке хитро рассчитываются каждый раз заново. Не влияет на динамически подгруженные посты (по кнопке "ещё посты"). Посты со спрятанным рейтингом всегда показываются.'}
            ,optionsCount:{type:'text',value:'6',caption:'Количество опций: ',description:'Cколько опций будет в ниспадающем меню. Когда комментариев в посте мало, опций может быть меньше, чем это значение.'}
            ,defaultOption:{type:'text',value:'0',caption:'Опция по умолчанию: ', description:'Какая опция применится сразу после того, как вы откроете главную.'}
            ,checkComments:{type:'checkbox',value:false,caption:'Учитывать комментарии', description:'Не скрывать посты с бОльшим, чем указано, количеством комментариев'}
            ,commentsCount:{type:'text',value:'20',caption:'Количество комментариев: ', description:'Работает, если стоит галочка "Учитывать комментарии"'}
            ,saveSelectedOption:{type:'checkbox',value :true,caption:'Использовать опцию, выбранную на странице, вместо умолчания', description:'Если поставить тут галочку, то вместо опции по умолчанию будет использоваться та опция, которую вы последний раз выбрали в ниспадающем меню.'}
			},
    threshold: 0,
    variant: ['dirty.ru'],
    select:null,
    min_rating:0,
    max_rating:0,
    selected_index:0,
    select_properties:{thresholds:[], selected_strings:[], counts:[]},
    sorted_posts:{},
    always_visible_count:0,
    hidden_rating_count:0,
    initial_posts_count:0,
    reset_timeout:null,
    my_posts:{},
        run: function()
        {
            if (!d3.content.posts.length || d3.page.user || d3.page.f_search) {
                return false;
            }

            this.initial_posts_count = d3.content.posts.length;

            if (this.config.saveSelectedOption.value) {
                this.selected_index = d3.storage.get('postsSelectedThreshold'); // todo ask about how to use hidden options
                if (!this.selected_index) {
                    this.selected_index = 0;
                }
            } else {
                this.selected_index = parseInt(this.config.defaultOption.value);
                if (this.selected_index < 0) {
                    this.selected_index = 0;
                }
            }

            this.getStats();
            this.prepareThresholds();
            this.updateVisibility(false);
            this.addResetLink();
            this.displaySelect();
        },

        displaySelect: function()
        {
            var comments_part = '';
            var select_width = 130;
            if (this.config.checkComments.value) {
                comments_part = ' или ' + this.config.commentsCount.value + ' комм.';
                select_width = 210;
            }

            if (this.hidden_rating_count) {
                select_width = select_width + 30;
            }
            var me = this;
            var header_div = $j(".p-post-list__toolbar:first");
            var select_div = $j('<div id="advansed_treshhold_div" style="display:inline;margin-left:5px;margin-right:5px;"></div>');
            this.select  = $j('<select id="advansed_treshhold" style="width:' + select_width + 'px;font-size:15px;"></select>');
            select_div.append(this.select);
            header_div.after(select_div);

            for (var i=0; i<this.select_properties.thresholds.length;i++) {
                var visible_count = this.always_visible_count + this.select_properties.counts[i];
                var hidden_part = this.hidden_rating_count ? (this.hidden_rating_count + '+') : '';
                if (this.hidden_rating_count) {
                    visible_count = visible_count - this.hidden_rating_count;
                }
                var option_title = i+': Рейт ' + this.select_properties.thresholds[i] + comments_part + " (" + hidden_part + visible_count + ")";
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
        },

        addResetLink: function() {
            var header_div = $j("body");
            var reset_link = $j("<a href='javascript:void(0);' style = 'position: fixed; top: 10px; left: 50px; z-index: 999;'>R<span></span></a>");
            header_div.after(reset_link);
            var me = this;

            reset_link.click(function(){
                me.resetFilter(reset_link);
            });

            $j(document).on('d3_sp_new_posts', function (event) {
                clearTimeout(me.reset_timeout);
                me.reset_timeout = setTimeout(function(){
                    me.resetFilter(reset_link);
                }, 200);
            });
        },

        resetFilter: function(reset_link) {
            var me = this;
            me.threshold = 0;
            me.hidden_rating_count = me.always_visible_count = me.min_rating = me.max_rating = 0;
            me.select = null;
            me.select_properties = {thresholds:[], selected_strings:[], counts:[]};
            me.sorted_posts = this.my_posts = {};

            $j("#advansed_treshhold_div").remove();
            me.getStats();
            me.prepareThresholds();
            me.updateVisibility(false);
            me.displaySelect();
            
            var new_count = d3.content.posts.length;
            var diff = new_count - this.initial_posts_count;
            this.initial_posts_count = d3.content.posts.length;
            reset_link.find("span").text(" (+" + diff + ")").show().fadeOut(5000);
        },

        getStats: function()
        {
            for (var i=0; i<d3.content.posts.length; i++) {
                var rating = parseInt(d3.content.posts[i].ratingValue());
                if (isNaN(rating)) {
                    // should not happen for posts
                    continue;
                }
                if (this.sorted_posts[rating]===undefined) {
                    this.sorted_posts[rating] = [];
                }
                this.sorted_posts[rating].push(i);

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
            var posts_count = d3.content.posts.length;
            var rest_count = posts_count;
            var options_left = this.config.optionsCount.value;
            var curr_step = Math.floor(posts_count/options_left);

            var curr_i = -1;
            var curr_thresh_count = 0;
            var curr_thresh_value = null;

            for (var i=this.min_rating; i<=this.max_rating; i++) {
                if (this.sorted_posts[i]===undefined) {
                    continue;
                }
                if (curr_thresh_value===null) {
                    curr_thresh_value = i;
                }

                curr_thresh_count += this.sorted_posts[i].length;
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
        
        isVisible: function(post)
        {
            if (post.isMine) {
                this.always_visible_count++;
                this.my_posts[post.id] = post.id;
                return true;
            }
            var rating = post.ratingValue();
            if (rating === null) {
                this.hidden_rating_count++;
                return true;
            }
            if (rating >= this.threshold) {
                return true;
            }

            if (this.config.checkComments.value && post.commentsCount() >= this.config.commentsCount.value) {
                return true;
            }
            return false;
        },
        
        updateVisibility: function(first)
        {
            var show = function(item){item.css('display','block');};
            var hide = function(item){item.css('display','none');};
            
            for (var i=0; i<d3.content.posts.length; i++) {
            	var post = d3.content.posts[i];
                var isVisible = this.isVisible(post);
                
                (isVisible ? show : hide)(post.container);
                
                if (first) {
                    this.updateCounts(post.ratingValue(), isVisible);
                }
            }
        },

        onThresholdChange: function()
        {
            this.selected_index = this.select.find(':selected').attr('id').split('_')[1];
            if (this.config.saveSelectedOption.value) {
                d3.storage.set('postsSelectedThreshold', this.selected_index);
            }

            this.threshold = this.select.val();
            this.updateVisibility(false);
        }
});
