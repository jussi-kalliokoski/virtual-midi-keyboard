(function (window, Undefined){

	function adapt(original, modifier){
		if (modifier.constructor === String){
			return original + Number(modifier.substr(1));
		}
		return modifier;
	}

	function addClass(elem, cl){
		var classes, i, n, hasClass, elems = (isArrayish(elem)) ? elem : [elem];
		for (i=0; i < elems.length; i++){
			hasClass = false;
			if (!elems[i].className.length){
				classes = [];
			} else {
				classes = elems[i].className.split(' ');
			}
			for (n=0; n < classes.length; n++){
				if (classes[n] === cl){
					hasClass = true;
					break;
				}
			}
			if (!hasClass){
				classes.push(cl);
			}
			elems[i].className = classes.join(' ');
		}
	}

	function addClasses(elem, cls){ // Requires addClass()
		var cl = cls, i;
		if (cl.constructor === String){
			cl = cl.split(' ');
		}
		for (i=0; i<cl.length; i++){
			addClass(elem, cl[i]);
		}
	}

	function addModule(name, func){
		Jin[name] = fn[name] = func;
		func.name = name;
		//console.log('Added module '+name); // For debug
	}

	function appendAfter(elem, nodes){
		var parent = elem.parentNode, i;
		if (isArrayish(nodes)){
			for (i=0; i<nodes.length; i++){
				parent.insertBefore(fixNode(nodes[i]), elem.nextSibling);
			}
		} else {
			for (i=1; i<arguments.length; i++){
				parent.insertBefore(fixNode(arguments[i]), elem.nextSibling);
			}
		}
	}

	function appendBefore(elem, nodes){
		var parent = elem.parentNode, i;
		if (isArrayish(nodes)){
			for (i=0; i<nodes.length; i++){
				parent.insertBefore(fixNode(nodes[i]), elem);
			}
		} else {
			for (i=1; i<arguments.length; i++){
				parent.insertBefore(fixNode(arguments[i]), elem);
			}
		}
	}

	function appendChildren(parent, nodes){
		var i;
		if (isArrayish(nodes)){
			for (i=0; i<nodes.length; i++){
				parent.appendChild(fixNode(nodes[i]));
			}
		} else {
			for (i=1; i<arguments.length; i++){
				parent.appendChild(fixNode(arguments[i]));
			}
		}
	}

	function attr(elem, a, val){
		if (typeof a === 'string'){
			if (arguments.length < 3){
				elem.setAttribute(a, val);
			}
			return elem.getAttribute(a);
		} else if (typeof a === 'object') {
			var i;
			for (i in a){
				if (true){
					elem.setAttribute(i, a[i]);
				}
			}
		}
	}

	function bind(elem, type, func, pass){
		var fnc, i;
		if (isArrayish(elem)){
			for (i=0; i<elem.length; i++){
				bind(elem[i], type, func, pass);
			}
			return;
		}
		elem = (elem === document && isUndefined(elem['on'+type])) ? elem.documentElement : elem;
		if (bind[type]){
			return bind[type].bind(elem, type, func, pass);
		}
		fnc = function(e){
			if (!e){ // Fix some ie bugs...
				e = window.event;
			}
			if (!e.stopPropagation){
				e.stopPropagation = function(){ this.cancelBubble = true; };
			}
			e.data = pass;
			func.call(elem, e);
		};
		if (document.addEventListener){
			elem.addEventListener(type, fnc, false);
		} else {
			elem.attachEvent('on' + type, fnc);
		}
		bind._binds.push({elem: elem, type: type, func: func, fnc: fnc});
	}

	function byCl(cl, where){
		if (!where){
			where = document;
		}
		return collectByClass(cl, where);
	}

	function byId(id, where){
		if (!where){
			where = document;
		}
		return where.getElementById(id);
	}

	function byTag(tag, where){
		if (!where){
			where = document;
		}
		return where.getElementsByTagName(tag);
	}

	function clone(elem, deep){
		if (!deep){
			deep = false;
		}
		return elem.cloneNode(deep);
	}

	function commandLine(){
		var path, getdata, iddata;

		this.id = function(id){
			var i, l;
			reload();
			for (i=0, l=iddata.length; i<l; i++){
				if (id === iddata[i].name){
					return iddata[i].value;
				}
			}
			return false;
		};

		this.get = function(id){
			var i, l;
			reload();
			for (i=0, l=getdata.length; i<l; i++){
				if (id === getdata[i].name){
					return getdata[i].value;
				}
			}
			return false;
		};

		function reload()
		{
			if (path === location.href){
				return;
			}
			var pathsplit, getsplit, get, id, i, l, val, splitbreak;
			path = location.href;
			getdata = [];
			iddata = [];
			pathsplit = path.split('?');
			getsplit = pathsplit[pathsplit.length-1].split('#');
			if (pathsplit.length > 1){
				get = getsplit[0].split('&');
				for (i=0, l=get.length; i<l; i++){
					splitbreak = get[i].split('=');
					val = (splitbreak.length === 1) ? true : splitbreak[1];
					getdata.push({name: splitbreak[0], value: val});
				}
			}
			if (getsplit.length > 1){
				id = getsplit[1].split('&');
				for (i=0, l=id.length; i<l; i++){
					splitbreak = id[i].split('=');
					val = (splitbreak.length === 1) ? true : splitbreak[1];
					iddata.push({name: splitbreak[0], value: val});
				}
			}
		}
	}

	function create(type, id){
		if (!type){
			type = 'div'; // The probabilities are...
		} else if (typeof type === 'object' && !id) {
			id = type;
			type = 'div';
		}
		var elem = document.createElement(type), prop;
		if (id){
			if (typeof id === 'object'){
				for (prop in id){
					if (id.hasOwnProperty(prop)){
						switch(prop){
							case 'css':
								extend(elem.style, id[prop]);
								break;
							case 'html':
								elem.innerHTML = id[prop];
								break;
							default:
								elem.setAttribute(prop, id[prop]);
						}
					}
				}
			} else {
				elem.id = id;
			}
		}
		return elem;
	}

	function css(elem, property, value){
		var	style = elem.style,
			prop;
		if (typeof property === 'object'){
			for (prop in property){
				if (prop[0] === '$'){
					experimentalCss(elem, prop.substr(1), property[prop]);
				} else {
					style[prop] = property[prop];
				}
			}
		} else if (isUndefined(value)) {
			return style[property];
		}
		if (property[0] === '$'){
			experimentalCss(elem, property.substr(1), value);
		} else {
			style[property] = value;
		}
	}

	function dynamicCss(selector, properties){
		var	elem	= create('style'),
			css	= selector + '{',
			prop, sprop;
		function addProperty(propertyName, propertyValue){
			css += propertyName + ':' + propertyValue + ';';
		}
		for (prop in properties){
			if (properties.hasOwnProperty(prop)){
				sprop = prop;
				if (prop[0] === '$'){
					sprop = prop.substr(1);
					addProperty('-webkit-' + sprop, properties[prop]);
					addProperty('-moz-' + sprop, properties[prop]);
					addProperty('-o-' + sprop, properties[prop]);
				}
				addProperty(sprop, properties[prop]);
			}
		}
		css += '}';
		elem.innerHTML = css;
		byTag('head')[0].appendChild(elem);
		return elem;
	}

	function fixNode(node){
		if (typeof node === 'string'){
			node = document.createTextNode(node);
		}
		return node;
	}

	function DOMReady(){
		if (document.removeEventListener){
			document.removeEventListener('DOMContentLoaded', DOMReady, false);
		} else if (document.detachEvent) {
			if (document.readyState !== 'complete'){
				return;
			}
			document.detachEvent('onreadystatechange', DOMReady);
		}
		ready();
	}

	function extend(obj){
		var i, n;
		for (i=1; i<arguments.length; i++){
			for (n in arguments[i]){
				if (true){
					obj[n] = arguments[i][n];
				}
			}
		}
		return obj;
	}

	function experimentalCss(elem, property, value){
		var prefixes, i;
		if (isArrayish(elem)){
			for (i=0; i<elem.length; i++){
				experimentalCss(elem[i], property, value);
			}
			return;
		}
		prefixes = ['', '-webkit-', '-moz-', '-o-'];
		if (!value){
			while(prefixes.length && !value){
				value = elem.style[prefixes.pop() + property];
			}
			return value;
		} else {
			while (prefixes.length){
				elem.style[prefixes.pop() + property] = value;
			}
		}
	}

	function getElementsByClassName(elem, cl){
		return collectByClass(cl, elem);
	}

	function getElementsByTagName(elem, tg){
		return elem.getElementsByTagName(tg);
	}

	function getOffset(elem, parent){ // Independent
		var top = 0, left = 0;
		do{
			left += elem.offsetLeft || 0;
			top += elem.offsetTop || 0;
			elem = elem.offsetParent;
		} while (elem && elem !== parent);
		return {left: left, top: top};
	}

	function getSize(elem){
		return {width: elem.offsetWidth, height: elem.offsetHeight};
	}

	function getWindowSize(wnd){
		if (!wnd){
			wnd = window;
		}
		if (window.document.documentElement){
			return {width: wnd.document.documentElement.clientWidth, height: wnd.document.documentElement.clientHeight};
		}
		return {width: elem.document.body.clientWidth, height: elem.document.body.clientHeight};
	}

	function handleReady(){ // jQuery-ish :)
		if (ready.bound){
			return;
		}
		ready.bound = true;

		ready.f = [];
		ready.p = [];

		if (document.readyState === 'complete'){
			return setTimeout(ready, 1);
		}
		if (document.addEventListener){
			document.addEventListener('DOMContentLoaded', DOMReady, false);
			window.addEventListener('load', ready, false);
		} else if (document.attachEvent) {
			document.attachEvent('onreadystatechange', DOMReady, false);
			window.attachEvent('onload', ready);
		}
	}

	function hasClass(elem, cl){
		var classes, i, n;
		elems = (isArrayish(elem)) ? elem : [elem];
		for (i=0; i < elems.length; i++){
			classes = elems[i].className.split(' ');
			for (n=0; n < classes.length; n++){
				if (classes[n] === cl){
					return true;
				}
			}
		}
		return false;
	}

	function hasClasses(elem, cls){
		var cl = cls, i;
		if (cl.constructor === String){
			cl = cl.split(' ');
		}
		for (i=0; i<cl.length; i++){
			if (!hasClasses){
				return false;
			}
		}
		return true;
	}

	function html(elem, str){
		if (arguments.length > 1){
			elem.innerHTML = str;
		}
		return elem.innerHTML;
	}

	function isArray(obj){ // Are there faster / more reliable methods out there?
		return !!(obj && (obj.isArray || obj.constructor === Array));
	}

	function isArrayish(obj){ // Same as isArray, but also accepts NodeList
		if (!obj){
			return false;
		}
		var constructor = obj.constructor;
		return constructor === Array || constructor === NodeList || constructor === StaticNodeList || constructor === layer;
	}

	function isUndefined(obj){
		return typeof obj === 'undefined';
	}

	function layer(itemSet){
		function Layer(){}
		function setAlign(elem, pos)
		{
			elem.style.zIndex = pos;
		}

		var lr = [], i;
		if (isArrayish(itemSet)){
			for (i=0; i<itemSet.length; i++){
				lr.push(itemSet[i]);
			}
		} else {
			for (i=0; i<arguments.length; i++){
				lr.push(arguments[i]);
			}
		}
		lr._concat = lr.concat;
		extend(lr, {
			refresh: function(){
				for (i=0; i<this.length; i++){
					setAlign(this[i], i);
				}
			}, indexOf: function(elem){
				for (i=0; i<this.length; i++){
					if (this[i] === elem){
						return i;
					}
				}
				return -1;
			}, first: function(){
				return layer(this[0]);
			}, last: function(){
				return layer(this[this.length-1]);
			}, item: function(i){
				return layer(this[i]);
			}, move: function(elem, to){
				if (to >= this.length - 1){
					return this.toTop(elem);
				}
				if (to <= 0){
					return this.toBottom(elem);
				}
				this.splice(this.indexOf(elem), 1);
				this.splice(to, 0, elem);
			}, toBottom: function(elem){
				this.splice(this.indexOf(elem), 1);
				this.unshift(elem);
			}, toTop: function(elem){
				this.splice(this.indexOf(elem), 1);
				this.push(elem);
			}, remove: function(elem){
				this.splice(this.indexOf(elem), 1);
			}, alignByDistance: function(fromelem, lefttoright, reorder){
				var point = this.indexOf(fromelem), dist = Math.max(point, this.length - point - 1) + 1, maxDist = dist;
				while (--dist){
					if (lefttoright){
						if (point - dist >= 0){
							setAlign(this[point - dist], (maxDist - dist) * 2 - 1);
						}
						if (point - dist < this.length){
							setAlign(this[point + dist], (maxDist - dist) * 2);
						}
					} else {
						if (point - dist < this.length){
							setAlign(this[point + dist], (maxDist - dist) * 2 - 1);
						}
						if (point - dist >= 0){
							setAlign(this[point - dist], (maxDist - dist) * 2);
						}
					}
				}
				setAlign(fromelem, maxDist * 2);
			}, each: function(func){
				var i;
				for (i=0; i<this.length; i++){
					func.call(this[i], i);
				}
				return this;
			}, undouble: function(){
				var i, d;
				for (i=0; i<this.length; i++){
					d = this.indexOf(this[i]);
					if (d !== i){
						this.splice(i--, 1);
					}
				}
				return this;
			}, concat: function(){
				var a, b;
				for (a=0; a<arguments.length; a++){
					for (b=0; b<arguments[a].length; b++){
						this.push(arguments[a][b]);
					}
				}
				return this;
			}
		}, layer.prototype);
		Layer.prototype = lr;
		Layer.prototype.constructor = layer;
		return new Layer();
	}

	function onReady(func, pd){
		if (ready.triggered){
			return func.call(document, {stopPropagation: function(){}, data: pd});
		}
		ready.f.push(func);
		ready.p.push(pd);
	}

	function prependChildren(parent, nodes){
		var i, firstChild = parent.firstChild;
		if (isArrayish(nodes)){
			for (i=0; i<nodes.length; i++){
				parent.insertBefore(fixNode(nodes[i]), firstChild);
			}
		} else {
			for (i=1; i<arguments.length; i++){
				parent.insertBefore(fixNode(arguments[i]), firstChild);
			}
		}
	}

	function ready(){
		if (ready.triggered){
			return;
		}
		ready.triggered = true;
		var propagate = true,
		e = {stopPropagation: function(){ propagate = false; }},
		i;
		for (i=0; i < ready.f.length && propagate; i++){
			e.data = ready.p[i];
			ready.f[i].call(document, e);
		}
	}

	function removeClass(elem, cl){
		var classes, i, n, hasClass, elems = (elem.length) ? elem : [elem];
		for (i=0; i < elems.length; i++){
			hasClass = false;
			if (!elems[i].className.length){
				classes = [];
			} else {
				classes = elems[i].className.split(' ');
			}
			for (n=0; n < classes.length; n++){
				if (classes[n] === cl){
					classes.splice(n--, 1);
				}
			}
			elems[i].className = classes.join(' ');
		}
	}

	function removeClasses(elem, cls){ // Requires removeClasses()
		var cl = cls, i;
		if (cl.constructor === String){
			cl = cl.split(' ');
		}
		for (i=0; i<cl.length; i++){
			removeClass(elem, cl[i]);
		}
	}

	function toArray(arr){
		if (typeof arr === 'string'){
			return [arr];
		}
		var	result	= [],
			i, l	= arr.length;
		for (i=0; i<l; i++){
			result.push(arr[i]);
		}
		return result;
	}

	function toggleClass(elem, cls){ // Requires hasClass(), addClass() and removeClass()
		if (hasClass(elem, cls)){
			removeClass(elem, cls);
		} else {
			addClass(elem, cls);
		}
	}

	function toggleClasses(elem, cls){ // Requires toggleClass and its dependencies
		var cl = cls, i;
		if (cl.constructor === String){
			cl = cl.split(' ');
		}
		for (i=0; i<cl.length; i++){
			toggleClass(elem, cl[i]);
		}
	}

	function trigger(elem, type){
		var i, event, propagate = true;
		if (isArrayish(elem)){
			for (i=0; i<elem.length; i++){
				trigger(elem[i], type);
			}
			return;
		}
		if (bind[type]){
			return bind[type].trigger(elem, type);
		}
		event = {
			preventDefault: function(){ this.isDefaultPrevented = true; },
			isDefaultPrevented: true,
			stopPropagation: function(){ propagate = false; }
		};
		for (i=0; i<bind._binds.length; i++){
			if (bind._binds[i].elem === elem && bind._binds[i].type === type && propagate){
				bind._binds[i].fnc.call(elem, event);
			}
		}
		if (elem['on'+type] && propagate){
			elem['on'+type].call(elem, event);
		}
	}

	function unbind(elem, type, func){
		var fnc, i;
		if (isArrayish(elem)){
			for (i=0; i<elem.length; i++){
				unbind(elem[i], type, func, pass);
			}
			return;
		}
		if (bind[type]){
			return bind[type].unbind(elem, type, func);
		}
		for (i=0; i<bind._binds.length; i++){
			if (bind._binds[i].elem === elem && bind._binds[i].type === type && bind._binds[i].func === func){
				if (document.addEventListener){
					elem.removeEventListener(type, bind._binds[i].fnc, false);
				} else {
					elem.detachEvent('on'+type, bind._binds[i].fnc);
				}
				bind._binds.splice(i--, 1);
			}
		}
	}

	function collectByClass(cl, element, tagName){
		if (!tagName){
			tagName = '*';
		}
		var	elems	= element.getElementsByTagName(tagName),
			l	= elems.length,
			result	= [],
			elem, i;
		for (i=0; i<l; i++){
			elem = elems[i];
			if (elem.className.indexOf(cl) > -1){
				result.push(elem);
			}
		}
		return result;
	}

	function Jin(){
		return Jin.init.apply(this, arguments);
	}

	var
		document = window.document,
		settings = {},
		modules = {},
		fn = {},
		NodeList = window.NodeList || ((document.getElementsByTagName) ? document.getElementsByTagName('').constructor : Undefined),
		StaticNodeList = window.StaticNodeList || ((document.querySelectorAll) ? document.querySelectorAll('X').constructor : Undefined);

	(function(){ // Check if we can collect classes with a faster method.
		var testElement = document.createElement('div');
		testElement.innerHTML = '<div class="t e"></div><div class=t></div>';
		if (testElement.getElementsByClassName && testElement.getElementsByClassName('e').length){
			testElement.lastChild.className = 'e';
			if (testElement.getElementsByClassName('e').length === 2){
				collectByClass = function(cl, element){
					return element.getElementsByClassName(cl);
				};
			}
		} else if (testElement.querySelectorAll) {
			testElement.innerHTML = '<div class=T></div>';
			if (testElement.querySelectorAll('.T').length){
				collectByClass = function(cl, element){
					return element.querySelectorAll('.' + cl);
				};
			}
		}

		testElement = null;
	})();

	fn.settings = settings;
	fn.version = '0.2 Beta';
	fn.fn = fn;
	window.Jin = Jin;
	bind._binds = [];

	addModule('adapt', adapt);
	addModule('addClass', addClass);
	addModule('addClasses', addClasses);
	addModule('addModule', addModule);
	addModule('appendAfter', appendAfter);
	addModule('appendBefore', appendBefore);
	addModule('appendChildren', appendChildren);
	addModule('attr', attr);
	addModule('bind', bind);
	addModule('clone', clone);
	addModule('create', create);
	addModule('css', css);
	addModule('dynamicCss', dynamicCss);
	addModule('byCl', byCl);
	addModule('byId', byId);
	addModule('byTag', byTag);
	addModule('extend', extend);
	addModule('experimentalCss', experimentalCss);
	addModule('getElementsByTagName', getElementsByTagName);
	addModule('getElementsByClassName', getElementsByClassName);
	addModule('getOffset', getOffset);
	addModule('getSize', getSize);
	addModule('getWindowSize', getWindowSize);
	addModule('hasClass', hasClass);
	addModule('hasClasses', hasClasses);
	addModule('html', html);
	addModule('isArray', isArray);
	addModule('isArrayish', isArrayish);
	addModule('isUndefined', isUndefined);
	addModule('layer', layer);
	addModule('onReady', onReady);
	addModule('prependChildren', prependChildren);
	addModule('removeClass', removeClass);
	addModule('removeClasses', removeClasses);
	addModule('toggleClass', toggleClass);
	addModule('toggleClasses', toggleClasses);
	addModule('trigger', trigger);
	addModule('unbind', unbind);

	addModule('init', function (arg1, arg2){
		if (arg1.constructor === Function){
			return onReady(arg1, arg2);
		}
		if (arg1.constructor === String && arg2.constructor === Function){
			return addModule(arg1, arg2);
		}
		if (isArrayish(arg1)){
			return layer(arg1);
		}
		if (arguments.length){
			return layer.apply(this, arguments);
		}
		return Jin;
	});

	fn.commandLine = new commandLine();

	bind.ready = {
		bind: function(elem, type, func, pass){
			if (elem === document || elem === window){
				return onReady(func, pass);
			}
		},
		unbind: function(){}, // Is this really necessary?
		trigger: function(){
			if (elem === document || elem === window){
				return ready();
			}
		}
	};
	handleReady();

	extend(Jin, fn);

	layer.prototype.appendAfter = layer.prototype.after = function(a){
		if (typeof a === 'string'){
			return this.each(function(){
				appendAfter(this, a);
			});
		}
		var	args	= [this[0]],
			i, l	= arguments.length;
		for (i=0; i<l; i++){
			args.push(arguments[i]);
		}
		appendAfter.apply(this[0], args);
		return this;
	}
	layer.prototype.appendBefore = layer.prototype.before = function(a){
		if (typeof a === 'string'){
			return this.each(function(){
				appendBefore(this, a);
			});
		}
		var	args	= [this[0]],
			i, l	= arguments.length;
		for (i=0; i<l; i++){
			args.push(arguments[i]);
		}
		appendBefore.apply(this[0], args);
		return this;
	}
	layer.prototype.appendChildren = layer.prototype.append = function(){
		var	args	= [this[0]],
			i, l	= arguments.length;
		for (i=0; i<l; i++){
			args.push(arguments[i]);
		}
		appendChildren.apply(this[0], args);
		return this;
	};
	layer.prototype.prependChildren = layer.prototype.prepend = function(){
		var	args	= [this[0]],
			i, l	= arguments.length;
		for (i=0; i<l; i++){
			args.push(arguments[i]);
		}
		prependChildren.apply(this[0], args);
		return this;
	};
	layer.prototype.attr = function(a, b){
		if (typeof a === 'string' && arguments.length < 2){
			return attr(this[0], a);
		}
		return this.each(function(){
			return attr(this, a, b);
		});
	};
	layer.prototype.bind = function(a, b, c){
		return this.each(function(){
			return bind(this, a, b, c);
		});
	};
	layer.prototype.byClass = function(cl) {
		var lr = new layer();
		this.each(function(){
			if (hasClass(this, cl)){
				lr.push(this);
			}
			lr.concat(getElementsByClassName(this, cl));
		});
		return lr;
	};
	layer.prototype.byTag = function(tg) {
		var lr = new layer();
		this.each(function(){
			if (this.tagName === tg){
				lr.push(this);
			}
			lr.concat(getElementsByTagName(this, tg));
		});
		return lr;
	};
	layer.prototype.clone = function(a){
		var lr = new layer();
		this.each(function(){
			lr.push(clone(this, a));
		});
		return lr;
	};
	layer.prototype.css = function(a, b){
		if (typeof a !== 'object' && !b){
			return css(this[0], a);
		}
		return this.each(function(){
			return css(this, a, b);
		});
	};
	layer.prototype.unbind = function(a, b){
		return this.each(function(){
			return unbind(this, a, b);
		});
	};
	layer.prototype.trigger = function(a){
		return this.each(function(){
			return trigger(this, a);
		});
	};
	layer.prototype.experimentalCss = function(a, b){
		return this.each(function(){
			return experimentalCss(this, a, b);
		});
	};
	layer.prototype.getOffset = function(i){
		if (!i){
			i=0;
		}
		return getOffset(this[i]);
	};
	layer.prototype.getSize = function(i){
		if (!i){
			i=0;
		}
		return getSize(this[i]);
	};
	layer.prototype.hasClass = function(a){
		var b = false;
		this.each(function(){
			if (hasClass(this, a)){
				b = true;
			}
		});
		return b;
	};
	layer.prototype.hasClasses = function(a){
		var b = false;
		this.each(function(){
			if (hasClasses(this, a)){
				b = true;
			}
		});
		return b;
	};
	layer.prototype.html = function(a){
		if (!arguments.length){
			return html(this[0]);
		}
		return this.each(function(){
			html(this, a);
		});
	};
	layer.prototype.addClass = function(a){
		return this.each(function(){
			return addClass(this, a);
		});
	};
	layer.prototype.addClasses = function(a){
		return this.each(function(){
			return addClasses(this, a);
		});
	};
	layer.prototype.removeClass = function(a){
		return this.each(function(){
			return removeClass(this, a);
		});
	};
	layer.prototype.removeClasses = function(a){
		return this.each(function(){
			return removeClasses(this, a);
		});
	};
	layer.prototype.toggleClass = function(a){
		return this.each(function(){
			return toggleClass(this, a);
		});
	};
	layer.prototype.toggleClasses = function(a){
		return this.each(function(){
			return toggleClasses(this, a);
		});
	};
	layer.prototype.ready = function(a, b){ // For jQuery migrators
		return onReady(a, b);
	};
}(this));
