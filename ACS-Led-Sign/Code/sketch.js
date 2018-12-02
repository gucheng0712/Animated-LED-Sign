var serial;
var serialOptions = {
	baudrate: 115200
};
var inData;
var outData = "#000000";
var pix = [];
var millisLast;
var doAnimation = false;
var pixCounter = 0;
var rainbowStep = 0;

var isClockwise = true;
var speed;


var aioKey = "aa085d4a8f384eaca3b706f3f6b30085";
var aioGroup = "Default";
var aioData = "#00ffff";
var aioDataLast = "#000000";

var animationState = 0;


function setup() {
	createCanvas(640, 480);
	serial = new p5.SerialPort();
	serial.on('list', printList);
	serial.on('data', serialEvent);
	serial.open('COM3', serialOptions); // modify with your Serial port assignment here
	millisLast = millis();

	hex = new Hexagon();
	lightSensor = new Sensor();
	pushButton = new Button();

	for (var i = 0; i < 18; i++)
		pix.push(new Pixel());
}

function serialEvent() {
	var inString = serial.readLine();
	var splitString = split(inString, ',');

	if (splitString[0].length > 0) {
		if (splitString[0][0] == 'S') {
			lightSensor.setVal(Number(splitString[0].substring(3)));
			//print("sensor: " + lightSensor.val);
		}
	}

	if (splitString.length > 1 && splitString[1].length > 0) {
		if (splitString[1][0] == 'B') {
			pushButton.setVal(Number(splitString[1].substring(3)));
			//print("button: " + pushButton.val );
		}
	}
}

function printList(portList) {
	for (var i = 0; i < portList.length; i++) {
		print(i + " " + portList[i]);
	}
}

function keyTyped() {


}

function aioGetData(aioJsonData) {
	aioData = aioJsonData.feeds[2].last_value;
	print(aioData);

	if (aioData != aioDataLast) {
		for (var i = 0; i < pix.length; i++) {
			pix[i].fadeHexColor(aioData);
		}
		aioDataLast = aioData;
	}

}

function writePixelData() {
	outDataLast = outData;
	outData = "";

	for (var i = 0; i < pix.length; i++) {
		pix[i].updateColor();

		if (enableGammaCorrection)
			outData += pix[i].ledColor;
		else
			outData += pix[i].hexColor;
	}
	//console.log(outData);
	serial.write("1" + outData + "\r");

	//for(var i=2; i<9; i++)
	//  serial.write(i + "" + outData + "\r");
}

function draw() {
	print(doAnimation);
	background(200);
	if (doAnimation) {
		var checkUrl = ("http://io.adafruit.com/api/groups/" + aioGroup + "/receive.json?x-aio-key=" + aioKey);
		loadJSON(checkUrl, aioGetData);
	}
	speed = map(lightSensor.val, 130, 200, 100, 10, true);
	print(lightSensor.val);
	if (millis() - millisLast > speed) {
		if (doAnimation) {
			Animation_Two();

		} else {
			Animation_One();
		}


		writePixelData();
		millisLast = millis();
	}

	drawLedRing();
	hex.angle += lightSensor.val / 200;
	hex.draw();
	lightSensor.draw();
	pushButton.draw();
}

function drawLedRing() {
	push();
	translate(height / 2, height / 2);
	scale(0.75);
	for (var i = 0; i < pix.length; i++) {
		push();
		rotate(i * TWO_PI / pix.length);
		translate(width / 4, 0);
		fill(pix[i].r, pix[i].g, pix[i].b);
		ellipse(0, 0, 40, 40);
		pop();
	}
	pop();
}

function hexColor(r, g, b) {
	// return a string formatted #rrggbb
	return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}


function Animation_One() {
	if (isClockwise) {
		for (var i = 0; i < pix.length; i++) {
			if (pixCounter == i) {
				pix[i].setHexColor(rainbowColor(i, rainbowStep));
			} else {
				pix[i].fadeColor(0, 0, 0);
			}
		}

		if (pixCounter < pix.length)
			pixCounter++;
		else {
			pixCounter = 0;
			isClockwise = false;
			pixCounter = pix.length - 1;
		}


		if (rainbowStep < 255)
			rainbowStep += 5;
		else
			rainbowStep = 0;
	} else {
		for (var i = pix.length - 1; i > 0; i--) {
			if (pixCounter == i) {
				pix[i].setHexColor(wheelColor(rainbowStep));
			} else {
				pix[i].fadeColor(0, 0, 0);
			}
		}

		if (pixCounter > 0)
			pixCounter--;
		else {
			pixCounter = pix.length - 1;
			isClockwise = true;
			pixCounter = 0;
		}


		if (rainbowStep < 255)
			rainbowStep += 5;
		else
			rainbowStep = 0;
	}
}

function Animation_Two() {
	for (var i = 0; i < pix.length; i++) {
		if (pixCounter == i) {
			pix[i].setHexColor(aioData);

		} else {
			pix[i].fadeColor(0, 0, 0);
		}
	}

	if (pixCounter < pix.length)
		pixCounter++;
	else
		pixCounter = 0;

	if (rainbowStep < 255)
		rainbowStep += 5;
	else
		rainbowStep = 0;

}


//
