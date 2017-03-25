/**
 *
 */

var Comment=function(container)
{
	this.container=container;
	container.get(0).comment=this;
	this.id=this.container.attr('id').replace("b-comment-", "");
	this.isNew=this.container.hasClass('b-comment_unread_true');
	this.isMine=(this.container.data('user-id') == d3.user.id);
	this.userId=this.container.attr('data-user_id');
	this.userName=$j('.b-user-login__login',this.container).text();
    var parent = this.container.parent().closest(".b-comment:not(#b-comment-root)");
    this.parentId=parent.length ? parent.attr('id').replace("b-comment-", "") : '';
};
Comment.prototype=new Item
({
	contentClass: '.b-comment__content-cell',
	bodyClass: '.b-comment__content-cell',
	footerClass: '.b-comment__footer',
	getAuthor: function(){return new User(this.userName,this.userId);},
	getClass: function(){return 'comment';}
});

d3.Comment=Comment;