var	onmidievent	= function(e){
	if (parent && parent.onmidi){
		parent.onmidi(e);
	}
};

(function(window, Jin){

var	isKeyFlat	= [false, true, false, true, false, false, true, false, true, false, true, false],
	keyNames	= ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
	keys		= new Jin.layer(),
	keymap = [
		[90, 48],// C1
		[83, 49],
		[88, 50],
		[68, 51],
		[67, 52],
		[86, 53],
		[71, 54],
		[66, 55],
		[72, 56],
		[78, 57],
		[74, 58],
		[77, 59],
		[81, 60],// C2
		[50, 61],
		[87, 62],
		[51, 63],
		[69, 64],
		[82, 65],
		[53, 66],
		[84, 67],
		[54, 68],
		[89, 69],
		[55, 70],
		[85, 71],
		[73, 72], // C3
		[57, 73],
		[79, 74],
		[48, 75],
		[80, 76]
	],
	container,
	settingButton,
	keyboard,
	pitchWheel,
	modWheel,
	mouseDown	= false,
	mkey		= -1,
	touchedKeys	= [],
	pressedKeys	= [],
	availableDevs	= [],
	channel		= 1,
	velocity	= 127,
	pitchBendAmount	= 8192,

	create		= Jin.create,
	bind		= Jin.bind,
	addClass	= Jin.addClass,
	removeClass	= Jin.removeClass;

function isIn(needle, haystack){
	var i, l = haystack.length;
	for (i=0; i<l; i++){
		if (needle === haystack[i]){
			return true;
		}
	}
	return false;
}

function settings(){
	if (localStorage.shadows){
		settings.noShadows = localStorage.shadows !== 'true';
		settings.noAnimation = localStorage.animation !== 'true';
	} else {
		settings.noShadows = false;
		settings.noAnimation = false;
	}
	settings.save = function(){
		localStorage.shadows = !settings.noShadows;
		localStorage.animation = !settings.noAnimation;
	};
	settings.open = function(){
		var	settingWindow	= document.getElementById('settings'),
			devSelect	= create('select'),
			sh, an, elem, i,
			l		= availableDevs.length;

		elem = create('option', {value: 'N/A'});
		elem.innerHTML = '&lt;select a device&gt;';
		devSelect.appendChild(elem);
		
		for(i=0; i<l; i++){
			elem = create('option', {
				value: availableDevs[i].id
			});
			elem.innerHTML = availableDevs[i].device + ': ' + availableDevs[i].port;
			devSelect.appendChild(elem);
		}

		settingWindow		= create();
		settingWindow.id	= 'settings';
		document.body.appendChild(settingWindow);
		sh = create('button');
		an = create('button');
		sh.innerHTML = 'Toggle Shadows';
		an.innerHTML = 'Toggle Animation';
		Jin.appendChildren(settingWindow, sh, an, devSelect);
		Jin.bind(sh, 'click', function(){ Jin.toggleClass(document.body, 'noShadows'); });
		Jin.bind(an, 'click', function(){ Jin.toggleClass(document.body, 'noAnimation'); });
		Jin.bind(devSelect, 'change', function(){ if(this.value !== 'N/A'){ window.talkToJava('midi-in', this.value); } });
		Jin.bind(settingWindow, 'click', function(e){
			if (e.target !== settingWindow){
				return;
			}
			settingWindow.parentNode.removeChild(settingWindow);
			settingWindow = null;
			return;
		});
	};
}

function updateArguments(){
	var cmd = Jin.commandLine.id;
	if (cmd('noAnimation') || cmd('lightMode') || settings.noAnimation){
		Jin.addClass(document.body, 'noAnimation');
	} else {
		Jin.removeClass(document.body, 'noAnimation');
	}
	if (cmd('noShadows') || cmd('lightMode') || settings.noShadows){
		Jin.addClass(document.body, 'noShadows');
	} else {
		Jin.removeClass(document.body, 'noShadows');
	}
}

function remap(){
	var i, newMap = {};
	for (i=0; i<keymap.length; i++){
		newMap[keymap[i][0]] = keymap[i][1];
	}
	keymap = newMap;
}

function pitchBend(am){
	if (!am){
		pitchBendAmount = 8192;
	} else {
		pitchBendAmount += am;
	}
	if (pitchBendAmount > 16383){
		pitchBendAmount = 16383;
	}
	if (pitchBendAmount < 0){
		pitchBendAmount = 0;
	}
	pitchWheel.value = 1 - pitchBendAmount / 16383;
}

function setPitchBend(val){
	pitchBendAmount = val * 16383;
	var	firstByte	= Math.floor(pitchBendAmount / 128),
		secondByte	= Math.floor(pitchBendAmount - firstByte * 128),
		midiEv		= new MidiEvent(channel, 14, firstByte, secondByte);
	onmidievent(midiEv);
}

function release(num, ch){
	var i = pressedKeys.indexOf(num);
	if (num < 0 || i === -1){
		return;
	}
	pressedKeys.splice(i, 1);
	keys.item(num).removeClass('pressed');
	onmidievent(new MidiEvent(ch || channel, 8, num, 0));
}

function press(num, ch, vel){
	var i = pressedKeys.indexOf(num);
	if (num < 0 || i !== -1){
		return;
	}
	pressedKeys.push(num);
	keys.item(num).addClass('pressed');
	onmidievent(new MidiEvent(ch || channel, 9, num, vel || velocity));
}

function mouseKeyPress(num){
	if (num === mkey){
		return;
	}
	release(mkey);
	mkey = num;
	press(num);
}

function touching(e){
	var i, key, newTouches = [];
	for (i=0; i < e.touches.length; i++){
		key = keys.indexOf(e.touches[i].target);
		if (key === -1){
			return;
		}
		newTouches[i] = key;
	}
	for (i=0; i < touchedKeys.length; i++){
		if (!isIn(touchedKeys[i], newTouches)){
			release(touchedKeys[i]);
		}
	}
	for (i=0; i < newTouches.length; i++){
		if (!isIn(newTouches[i], touchedKeys)){
			press(newTouches[i]);
		}
	}
	touchedKeys = newTouches;
	if (e.preventDefault){
		e.preventDefault();
	}
}

function keyboardParamDown(num){
	if (num === 40) {
		pitchBend(-200);
	} else if (num === 38) {
		pitchBend(200);
	} else {
		return false;
	}
	return true;
}

function keyboardParamUp(num){
	if (num === 40 || num === 38){
		pitchBend();
	} else {
		return false;
	}
	return true;
}

function keyboardPress(num, oct){
	if (keymap[num]){
		press(keymap[num] + oct * 12);
		return true;
	}
}

function keyboardRelease(num, oct){
	if (keymap[num]){
		release(keymap[num] + oct * 12);
		return true;
	}
}

function MidiEvent(channel, status, data1, data2){
	Jin.extend(this, {
		channel: channel,
		status: status,
		data1: data1,
		data2: data2
	});
}

function createKeys(i){
	for (i=0; i<128; i++){
		keys.push(create());
		keys[i].className = 'key ' + (isKeyFlat[i % 12] ? 'black' : 'white');
		keys[i].title = keyNames[i % 12] + ' ' + Math.floor(i / 12);
		keys[i].id = 'key_' + i;
		container.appendChild(keys[i]);
	}
}

function defineElements(){
	keyboard = create({
		id: 'keyboard'
	});

	container = create({
		id: 'keycontainer',
		css: {left: '-560px'}
	});

	settingButton = create('button', {
		id: 'settingButton',
		title: 'Settings',
		html: 'Settings'
	});

	var sldOptions = {
		direction: 'vertical',
		width: 26,
		height: 150
	};

	pitchWheel = Jin.slider(sldOptions);
	modWheel = Jin.slider(sldOptions);
	pitchWheel.dom.id = 'pitchWheel';
	modWheel.dom.id = 'modWheel';

	Jin.appendChildren(keyboard, container);
	Jin.appendChildren(document.body, keyboard, settingButton, pitchWheel.dom, modWheel.dom);
	pitchWheel.refresh();
	modWheel.refresh();
}

function doBindings(){
	function keyDown(e){
		if (keyboardPress(e.which, e.shiftKey * 1 - e.ctrlKey * 1 + e.altKey * 1) || keyboardParamDown(e.which)){
			e.preventDefault();
		}
	}
	function keyUp(e){
		if (keyboardRelease(e.which, e.shiftKey * 1 - e.ctrlKey * 1 + e.altKey * 1) || keyboardParamUp(e.which)){
			e.preventDefault();
		}
	}

	bind(settingButton, 'click', settings.open);
	keys
		.bind('mousedown', function(e){
			e.preventDefault();
			mouseKeyPress(keys.indexOf(this));
		})
		.bind('mousemove', function(e){
			e.preventDefault();
			addClass(this, 'hover');
			if (mouseDown){
				mouseKeyPress(keys.indexOf(this));
			}
		})
		.bind('mouseout', function(e){
			removeClass(this, 'hover');
			mouseKeyPress(-1);
		});
	Jin(document.documentElement)
		.bind('mouseup', function(e) {
			e.preventDefault();
			mouseKeyPress(-1);
			mouseDown = false;
		})
		.bind('mousedown', function(e) {
			mouseDown = true;
		})
		.bind('keydown', keyDown)
		.bind('keyup', keyUp);
	Jin(container)
		.bind('touchstart', touching)
		.bind('touchmove', touching) // Well if these aren't messed up...
		.bind('touchend', touching)
		.bind('mousescroll', function(e) {
			var left		= Math.max(Math.min((parseFloat(container.style.left) + e.delta * 50), 0), keyboard.offsetWidth - 3075);
			container.style.left	= left+'px';
		});
	bind(window, 'hashchange', updateArguments);
	if (parent){
		Jin(parent)
			.bind('keydown', keyDown)
			.bind('keyup', keyUp);
	}

	var oldMoveFinish = pitchWheel.onmovefinish;
	pitchWheel.onmovefinish = function(){
		oldMoveFinish.apply(this, arguments);
		pitchWheel.value = 0.5;
	};
	pitchWheel.onchange = function(){
		setPitchBend(1 - pitchWheel.value);
	};
}

function midiDeviceList(xml){
	availableDevs = [];
	xml.replace(/<device id='([^']*)' type='([^']*)' available='([^']*)'><name><!\[CDATA\[([\w ]*) \| ([\w ]*)\]\]><\/name><\/device>/g, function(xml, id, type, available, device, port){
		if (type !== 'input'){
			return;
		}
		availableDevs.push({
			id: id,
			type: type,
			available: true,
			device: device,
			port: port
		});
	});
}

function midiDeviceMessage(xml){
	var pf = parseFloat;
	xml.replace(/<midi-data channel='([^']*)' command='([^']*)' status='([^']*)' data1='([^']*)' data2='([^']*)' \/>/g, function(xml, channel, command, status, data1, data2){
		channel	= pf(channel);
		command	= pf(command);
		status	= pf(status);
		data1	= pf(data1);
		data2	= pf(data2);
		switch(command){
			case 144:
				press(data1, channel, data2);
				break;
			case 128:
				release(data1, channel);
				break;
			default:
				window.onmidi(new MidiEvent(channel, status, data1, data2));
		}
	});
}

function initJava(){
	var appletObject = create('applet', {
		name:		'midiApplet',
		code:		'net.abumarkub.midi.applet.MidiApplet',
		archive:	'jar/midiapplet.jar',
		width:		'1',
		height:		'1',
		MAYSCRIPT:	''
	}), talkToFlash = window.talkToFlash = function(command, params){ // These are used to hack in to the system of midijava, we don't actually use flash.
		switch(command){
			case 'midi-connection-started': // Connection OK, working, so get devices.
				talkToJava('get-devices');
				break;
			case 'get-devices':
				midiDeviceList(params);
				break;
			case 'midi-data': // It's sending us MIDI data, so let's process it and put it forward.
				midiDeviceMessage(params);
				break;
		}
	}, talkToJava = window.talkToJava = function(command, params){
		appletObject.executeJavaMethod(command, params);
	};
	document.body.appendChild(appletObject);
}

pressedKeys.indexOf = Jin.layer().indexOf; // Well, if Array.indexOf isn't there, I don't know if any use case fits anyway, but what the heck...

remap();

MidiEvent.name = 'MidiEvent';


Jin(function(){
	settings();
	defineElements();
	createKeys();
	doBindings();
	updateArguments();
	initJava();
});

}(window, Jin));
