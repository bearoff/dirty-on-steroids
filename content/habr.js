// content interface module for *.dirty.ru
d3.addContentModule(/(.*\.)?(habr|geektimes).com/i,
{
	type: "Ядро",
	author: 'bearoff',
	name: 'Интерфейс к содержимому habr.com',
	variant: 'habr.com',
	posts: [],
	comments: [],
	commentListeners: [],
	postListeners: [],
	postsUpdatedHandler: new DelayedEventHandler(),
	commentsUpdatedHandler: new DelayedEventHandler(),
	itemsUpdatedHandler: new DelayedEventHandler(),

	run: function()
	{
        var HabrComment = function(container)
        {
            this.container=container;
            container.get(0).comment=this;
            this.id=this.container.data("comment-body");
            this.isMine=this.container.find('.is_author').length > 0;
            this.userName=$j('.tm-user-info__username',this.container).text();
            var parent = this.container.closest(".tm-comment-thread__children");
            this.parentId = "";
            if (parent) {
                // not working - draft
                var parent_comment = parent.find("> .tm-comment-thread__comment  > [class^='tm-comment-thread__indent']");
                this.parentId = parent_comment.data('comment-body');
            }
        };
        HabrComment.prototype = new Item
        ({
            contentClass: ".tm-comment-thread__comment > [class^='tm-comment-thread__indent']",
            bodyClass: '.tm-comment',
            footerClass: '.tm-comment-footer',
            getClass: function(){return 'tm-comment-footer';},
            ratingContainer: function(){
                return $j('.tm-votes-meter__value', this.container);
            }
        });
        d3.Comment = HabrComment;

        var HabrPost=function(container)
        {
            this.container=container;
            this.container.get(0).post=this;

            var el_id = container.attr("id");

            if (el_id) {
                var parts = el_id.split('_');
                this.id = parseInt(parts[parts.length-1], 10);
            } else {
                this.id = 0;
            }

            this.info=$j('.post-stats', this.container);
            this.userName = $j('.user-info__nickname',container).text();
            this.userId= ''; //parseInt($j("a.c_user", this.container).attr("data-user_id") ,10);
            this.isNew = true; // ($j(".post-stats__comments-count_new", this.info).text() != "0");
            this.isMine = this.userName==d3.user.name;
        };

        HabrPost.prototype=new Item
        ({
            contentClass: '.dt',
            bodyClass: 'div.dt div.dti div.post_body',
            footerClass: '.dd',
            getClass: function(){return 'post';},
            _idMask: /(\d+)\/?(#.*)?$/,

            switchBody: function()
            {
                with(this.container.style) if(display=='') display='none'; else display='';
                return false;
            },
            commentsCount: function(){
                var comments_count_div = this.info.find(".post-stats__comments-link .post-stats__comments-count:first");
                return parseInt(comments_count_div.text(), 10);
            },
            ratingContainer: function(){return $j('.voting-wjt__counter', this.info);}
        });

        d3.Post=HabrPost;

		var isInbox = false;
		d3.page=
		{
			inbox: isInbox,
			my: false,
			postComments: ($j(".tm-article-comments").length > 0),
			inboxComments: false,
			onlyNew: false,
			user: false
		};
		/// Get element(s) of page
		d3.get =
		{
			logoutLink: function(){return $j();},
			leftNavigation: function(){return $j();},
			items: function(){return d3.content.items();}
		};

		var me=this;

		this.countItems();

		d3.content=this;

		function processComment($comment) {
			var comment = new d3.Comment($comment);
			me.countComment(comment);
			me.commentListeners.forEach(function (listener) {
				try {
					listener(comment);
				} catch (e) {
					if(console) console.log(e);
				}
			});
		}
	},

	countItems: function()
	{
		this.posts=[];
		this.comments=[];
		var me=this;
		$j(".tm-comment-thread__comment > [class^='tm-comment-thread__indent']").each(function () {
			me.countComment(new d3.Comment($j(this)));
		$j('.content-list__item_post').each(function () {
            var post = new d3.Post($j(this));
            if (post.id) {
                me.countPost(post);
            }
		});
	},

	countPost: function(post) {
		this.posts.push(post);
	},

	countComment: function(comment) {
		this.comments.push(comment);
	},

	items: function(){return this.comments.length ? this.comments : this.posts.length ? this.posts : [];},

	onNewComment: function(fn){this.commentListeners.push(fn);},
	onNewPost: function(fn){this.postListeners.push(fn);},
	onPostsUpdated: function(fn){this.postsUpdatedHandler.addListener(fn);},
	onCommentsUpdated: function(fn){this.commentsUpdatedHandler.addListener(fn);},
	onItemsUpdated: function(fn){this.itemsUpdatedHandler.addListener(fn);},

	addItemsProcessor: function(processor)
	{
		var items = this.items();

		for(var i=0;i<items.length;++i)
			processor(items[i]);

		this.onNewComment(processor);
	},

	addToHeaderDrop: function(item)
	{
        this.addToHeaderNav(item);
	},

	addToHeaderNav: function(item)
	{
        setTimeout(() => {
            var list = $j('.tm-main-menu__section-content');
            list.append(item);
        }, 2000);
	},

	addToLeftNav: function(item, after)
	{
       this.addToHeaderNav(item);
	},

	addConfigLink: function(id, top)
	{
		if(top || 1)
			this.addToHeaderNav($j('<a id="'+id+'" href="#" title="Настройки сервис-пака">SP</a>'));
		else
			this.addToLeftNav($j('<li><a href="#" id="'+id+'"><div style="background: url(data:image/png;base64,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) 4px 1px no-repeat; height:50px;border-top:1px solid #e9e9e9;border-bottom:1px solid #e9e9e9"><span style="cursor:pointer;text-decoration:underline;line-height:50px;margin-left:62px">Настройки</span></div></a></li>'));
	},

	// collect user info
	findUser: function()
	{
		return { name: "", id: 0};
	},

	createLeftNavigator: function()
	{
		$j('ul.tabmenu').append('<li id="leftNavigator"><ul style="list-style-type: none; padding: 0px 0px 0px 5px; font-size: 0.85em;"></ul></li>');
	}

});
