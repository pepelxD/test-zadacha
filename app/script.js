(function(){
    function Form(settings) {
        if(!settings.elem) return;
        this.elem = settings.elem;
        this.callback = settings.callback;
        this.fields = Array.prototype.slice.apply(this.elem.elements);

        this.elem.addEventListener('submit', this.send.bind(this), false);
    }
    Form.prototype.checkField = function() {
        var valid = true;
        function sowError(elem) {
            elem.parentElement.classList.add('incorrect');
            elem.addEventListener('focus', function (event) {
                valid = true;
                if(elem.parentElement.classList.contains('incorrect')) {
                    elem.parentElement.classList.remove('incorrect');
                }
            });
        }
        this.fields.forEach(function(elem, i){
            if(elem.nodeName.toLowerCase() == 'input') {
                switch (elem.type.toLowerCase()) {
                    case 'text' :
                        if(elem.name === 'lastname' || elem.name === 'name' || elem.name === 'patronymic') {
                            var res = elem.value.search(/^[а-яА-ЯёЁa-zA-Z]+$/);
                            if(elem.value.length > 15 || res == -1) {
                                valid = false;
                                sowError(elem);
                            }
                        }
                        if(elem.name === 'age') {
                            var res = elem.value.search(/^\d+$/);
                            if(18 > elem.value || elem.value > 50 || res == -1) {
                                valid = false;
                                sowError(elem);
                            }
                        }
                        break;
                }
            }
        }, this);

        return valid;
    }
    Form.prototype.send = function(event) {
        event.preventDefault(); 
        if(!this.checkField()) return false;
        this.callback();
    }



    function User(options){
        var option = options;
        if(!options.elem) return;
        this.opt = {
            elem: null,
            update: {
                type: 'ajax',
                method: 'POST',
                handler: null,
            }
        }
        this.opt = settings(this.opt, options);
        this.userDom = this.opt.elem;
        this.lastname = this.userDom.querySelector('[data-type=lastname]');
        this.name = this.userDom.querySelector('[data-type=name]');
        this.patronymic = this.userDom.querySelector('[data-type=patronymic]');
        this.balans = this.userDom.querySelector('[data-type=balans]');
        this.updateBalans = this.userDom.querySelector('[data-type=update-balans]');
        this.init();

        function settings(obj1, obj2) {
            var set = {};
            for(var key in obj1) {
                if(obj1.hasOwnProperty(key)) {
                    if(Object.prototype.toString.call(obj1[key]) === '[object Object]') {
                        set[key] = settings(obj1[key], obj2[key]);
                    } else {
                        set[key] = key in obj2 ? obj2[key] : obj1[key];
                    }                    
                }
            }
            return set;
        }
    }
    User.prototype.render = function(options) {
        var _this = this;
        if(options.error) {
            var p = document.createElement('p');
            p.className = 'user_updateDateError';
            p.textContent = options.error;
            _this.userDom.appendChild(p);
            setTimeout(function(){
                _this.userDom.removeChild(p);
            }, 3000);
        } else if(options.fio) {
            this.lastname.textContent = options.fio.lastname;
            this.name.textContent = options.fio.name;
            this.patronymic.textContent = options.fio.patronymic;
        } else if (options.balans) {
            this.balans.textContent = options.balans;
        }
    }
    User.prototype.update = function(options) {
        var _this = this;
        var handler = null;
        switch(options.type) {
            case 'ajax' :
                handler = function(event) {
                    var formData = null;
                    var response = null;
                    var xhr = new XMLHttpRequest();
                    // проверим что была нажата кнопка оновления баланса
                    if(event.target.dataset.type == 'update-balans') {
                        formData = new FormData();
                        formData.append('update', 'balans');
                    } else {
                        formData = new FormData(_this.userDom.querySelector('[data-type=chenge-data]'));
                    }
                    xhr.open(options.method, options.handler, true);
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            response = JSON.parse(xhr.responseText);
                            _this.render(response);
                        }
                    }
                    xhr.send(formData);
                }
                break;
            case 'socket' :
                handler = function(event){
                    var formData = _this.userDom.querySelector('[data-type=chenge-data]');
                     _this.socket.send(JSON.stringify({
                        fio: {  
                            lastname: formData.elements.lastname.value,
                            name: formData.elements.name.value,
                            patronymic: formData.elements.patronymic.value,
                            age: formData.elements.age.value,
                        }
                    })); 
                }
                break;
        }
        return handler;
    }
    User.prototype.init = function() {
        var _this = this;
        if(this.opt.update.type == 'socket') {
            this.socket = new WebSocket('ws://' + this.opt.update.handler );
            this.socket.onopen = function(event) {
                console.log('успех');
            }
            this.socket.onmessage = function(event) {
                _this.render(JSON.parse(event.data));
            };
            this.socket.onerror = function(event) {
                _this.render({error: 'Ошибка, попробуйте еще раз, обновив перед этим страницу'});
            }
            this.socket.onclose = function(event) {
                if (event.wasClean) {
                    console.log('Соединение закрыто чисто');
                } else {
                    console.log('Обрыв соединения'); // например, "убит" процесс сервера
                }
                console.log('Код: ' + event.code + ' причина: ' + event.reason);
            };
        }
        this.chengeForm = new Form({
            elem: this.userDom.querySelector('[data-type=chenge-data]'),
            callback: this.update(this.opt.update),
        });
        // если есть кнопка обновления баланса, то нам нужен только метод для ajax запроса, так как websocket соединение уже открыто и прослушивется. Если конечно скрипт запущен с соответствующими настройками.
        if(this.updateBalans) {
            this.updateBalans.addEventListener('click', function(event){
                // схраним наструйку типа соединения
                var type = _this.opt.update.type;
                // пеезапишем ее на нужную
                _this.opt.update.type = 'ajax';
                // вызовем метод отправки данных
                _this.update( _this.opt.update)(event);
                // вернем настройку в прежнее положение на случай обновления страницы
                _this.opt.update.type = type;
            });
        }
    }
    var newUser = new User({
        elem: document.querySelector('.user'),
        update: {
            //handler: 'echo.websocket.org',
            handler: 'handler-ajax.php',
            //type: 'socket',
        }
    });
})();