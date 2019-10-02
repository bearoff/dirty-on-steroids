// code is dirty - was written as a draft for personal use
d3.addModule(
        {
            type: "Содержание",
            name: 'Экспорт моих вещей',
            author: 'bearoff',
            config: {active: {type: 'checkbox', value: 0, description:'Позволяет получить список всех ссылок со страницы "Мои вещи", и  разом убратьь их из своих вещей.'}},
            variant: ['dirty.ru'],
            urls: [],
            ticks: [],

            run: function ()
            {
                if (document.location.href !== "https://d3.ru/my/") {
                    return;
                }

                this.addButtons();

            },
            addButtons: function ()
            {
                var me = this;
                var export_btn = $j("<a href='javascript:void(0);' id='sp_export_my_things'>Получить список видимых ссылок</a>");
                var wrapper = $j("<div id='sp_export_my_things_div' style='margin: 10px 0 0'>");
                var links_div = $j("<div id='sp_links_div' style='margin: 20px 0 0'>");
                wrapper.append(export_btn);
                wrapper.append(links_div);
                $j(".p-thing-list__toolbar").append(wrapper);
                $j("#sp_export_my_things").css("text-decoration", "underline");
                $j("#sp_export_my_things").click(function(){
                    me.exportMyThings();
                });
            },
            prepareData: function ()
            {
                var urls = [];
                var links = $j(".b-comment-counter__link.b-comment-counter__link_type_all");
                var ticks = [];
                links.each(function () {
                    urls.push($j(this).attr("href"));
                    var footer = $j(this).parents(".b-post-footer");
                    var toolbar = footer.find(".b-post-toolbar");
                    var tick = toolbar.find(".b-post-toolbar__button_active_true:first");
                    tick.css("border", "1px solid blue");
                    ticks.push(tick);
                });

                this.urls = urls;
                this.ticks = ticks;
            },
            exportMyThings: function ()
            {
                var me = this;
                this.prepareData();
                $j("#sp_links_div").find("a").remove();

                for (var i=1; i < this.urls.length; i++) {
                    var url = this.urls[i];
                    var link = $j("<a target='_blank' href='" + url + "'>" + url + "</a>");
                    $j("#sp_links_div").append(link);
                }

                var mark_read_btn = $j("<a href='javascript:void(0);' id='sp_mark_read'>Убрать из моих вещей</a>");
                $j("#sp_links_div").append(mark_read_btn);
                
                $j("#sp_links_div").find("a").css("display", "block");
                $j("#sp_links_div").find("a").css("text-decoration", "underline");
                $j("#sp_mark_read").css("margin-top", "20px");
                $j("#sp_mark_read").click(function(){
                    me.removeFromMyThings();
                });

                var msg = "" + this.urls.length + "\n" + this.urls.join("\n");
                console.log(msg);
            },
            removeFromMyThings: function (f_silent)
            {
                if (!confirm("Убрать эти ссылки из моих вещей (займёт немного времени)?")) {
                    return;
                }

                $j("#sp_mark_read").remove();
                for (var i = 0; i < this.ticks.length; i++) {
                    (function(tick, url, i, f_last) {
                        setTimeout(function(){
                            tick.css("border", "1px solid red");
                            tick[0].click();
                            console.log(url + ' removed');
                            if (f_last) {
                                // posssible that other links are still working though
                                alert("По идее, всё. Но лучше обновить страницу и проверить.");
                            }
                        }, i*100);
                    })(this.ticks[i], this.urls[i], i, (i === this.ticks.length - 1));
                }
            }
        });
