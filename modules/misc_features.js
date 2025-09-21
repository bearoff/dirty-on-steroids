d3.addModule(
{
	type: "Содержание",
	name: 'Разное',
	author: 'bearoff',
	config: {active:{type:'checkbox',value:false, description:'1) Делает большой кнопку "Игнорировать пост" + игнорирует по однократному нажатию'}
            ,my_csrf_token:{type:'text',value:'',caption:'Быстрый игнор - CSRF токен: ',description:'Чтобы получить, надо проигнорировать пост, и скопировать из запроса. Вроде меняется редко.'}
			},
    variant: ['leprosorium.ru'],
    run: function()
    {
        if (!this.config.my_csrf_token.value) {
            alert('Please set CSRF token');
            return false;
        }

        if ($j(".b-comments_controls").length) {
            // this is not index
            return false;
        }

        const my_csrf_token = this.config.my_csrf_token.value;
        // chat-gpt generated
        document.querySelectorAll('.b-icon_button_close').forEach(el => {
            el.style.fontSize = '36px';
            el.addEventListener('click', function(e) {
                e.preventDefault();
                var post_id = this.getAttribute('onclick').match(/post_id:'(\d+)'/)[1];
                fetch('https://idiod.leprosorium.ru/ajax/feeds/posts/ignore/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: 'post=' + encodeURIComponent(post_id) + '&csrf_token=' + encodeURIComponent(my_csrf_token)
                }).then(res => {
                    if (res.status !== 200) {
                        alert('Ошибка: HTTP ' + res.status);
                    }
                    el.textContent = '✅';
                    $j('.b-futu_controls').remove();
                }).catch(err => {
                    alert('Ошибка запроса');
                });
            });
        });

    }
});
