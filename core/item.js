var Item=function(o){for(var i in o) this[i]=o[i];};
Item.prototype=
{
	offset: function(){return this.container.offset();},
	height: function(){return this.container.height();},
	getContent: function(){return $j(this.contentClass,this.container);},
	getBody: function(){return $j(this.bodyClass, this.container);},
	getContentText: function(){return this.getContent().text();},
	ratingContainer: function(){return $j('> .b-comment__body .b-rating__value-number', this.container);},
	ratingValue: function(){
        var container_temp = this.ratingContainer();
        if (container_temp.hasClass("vote_result__disabled")) {
            return null;
        } else {
            var text = container_temp.text();
            if (d3.content.variant === "habrahabr.ru") {
                text = text.replace("–", "-");
            }
            var val = parseInt(text, 10);
            return isNaN(val) ? null : val;
        }
    },
	getFooter: function(){return $j(this.footerClass,this.container);}
};

