// Total redirect from / to /new
d3.addModule(
{
	type: "Прочее",
	name: 'Переход с / на /new',
	author: 'Stasik0',
	config: {active:{type:'checkbox',value:true}},

	run: function()
	{
		if(document.location.pathname == '/' && document.location.href.indexOf('?')==-1){
			document.location.href = document.location.href+"new";
			return;
		}

		//modify old links
		$j('a[href$="d3.ru"], a[href$="d3.ru/"], a[href="/"]').not('a[href^="mailto:"]').not('a[class="b-blog_nav_sort_link"]').each(function(link){
			var href = $j(this).attr('href');
			if(href.indexOf('write')==-1){
				if(href.endsWith('/')){
					$j(this).attr('href', $j(this).attr('href')+'new');
				}else{
					$j(this).attr('href', $j(this).attr('href')+'/new');
				}
			}
		});
		$j('a.b-blog_nav_sort_link[href="/"]').each(function(link){
			$j(this).attr('href', $j(this).attr('href')+'?');
		});
	}

});