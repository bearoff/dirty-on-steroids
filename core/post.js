
var Post=function(container)
{
	this.container=container;
	this.container.get(0).post=this;

    var href = container.find('.b-post-title__link:first').attr('href');
    var post_link = href ? href.replace(/\/$/, "") : '';
    var parts = post_link.split('-');
	this.id = parseInt(parts[parts.length-1], 10);
	this.info=$j('.b-post-footer',this.container);
	this.userName = $j('.b-user-login__login',this.info).text();
	this.userId= ''; //parseInt($j("a.c_user", this.container).attr("data-user_id") ,10);
	this.isNew = ($j(".b-comment-counter__link_type_new .b-comment-counter__mobile", this.info).text() != "0");
	this.isMine = this.userName==d3.user.name;
};

Post.prototype=new Item
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
    commentsCount: function(){return parseInt(this.container.find(".b-comment-counter__mobile:first").text(), 10);},
    ratingContainer: function(){return $j('.b-rating__value-number', this.container);}
});

d3.Post=Post;
