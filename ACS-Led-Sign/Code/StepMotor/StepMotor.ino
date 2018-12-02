#include <Adafruit_NeoPixel.h>
#include <Stepper.h>
#include <MsTimer2.h>

static const int STEPS_PER_REVOLUTION = 64 * 32;
Stepper stepperMotor(STEPS_PER_REVOLUTION, 11, 9, 8, 10);
int motorTimer = 0;   
int motorPos = 0;
int motorPosNew = 0;

#define SENSOR_SIG  A0
#define SENSOR_GND  13  
int sensorVal = 0;
unsigned long sensorReadMs;

#define BTN_SIG 2
#define BTN_GND 3
int btnVal = 0;
int btnValLast = 0;

#define MODULE_NUM  1
#define NUM_PIXELS 18
#define DIN_PIN 6

unsigned long pix[NUM_PIXELS];
//char input[1 + NUM_PIXELS*7 + 1];
char input[1 + NUM_PIXELS*7 + 1];

Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_PIXELS, DIN_PIN, NEO_GRB + NEO_KHZ800);

void setup() 
{
  pinMode(SENSOR_SIG, INPUT_PULLUP);
  pinMode(SENSOR_GND, OUTPUT);
  digitalWrite(SENSOR_GND, LOW);

  pinMode(BTN_SIG, INPUT_PULLUP);
  pinMode(BTN_GND, OUTPUT);
  digitalWrite(BTN_GND, LOW);

  strip.begin();
  Serial.begin(115200);

  sensorReadMs = millis();
}

void loop() 
{
  int charsRead;
  int r, g, b;
  int n;
  
  if(Serial.available() > 0)
  {
    charsRead = Serial.readBytesUntil('\r', input, 1+NUM_PIXELS*7+1);
    input[charsRead] = '\0';   // terminate C-style string

    n = 0;
    int moduleNum = input[n++] - '0';

    if(moduleNum == MODULE_NUM)   // accept data for this module only
    {
      // read motor data
      if(n+3 < charsRead)
      {
        if(input[n] == 'M')   // received motor data
        {
          if(input[n+1] == 'F' || input[n+1] == 'B')
          {
            motorTimer = 255 - charsToHex(input[n+3], input[n+2]);
            if(motorTimer < 5)
                motorTimer = 5;   // set minimum value
            //Serial.println(motorTimer);
            
            if(motorTimer == 255)
              MsTimer2::stop();
            else
            {
              if(input[n+1] == 'F')
                MsTimer2::set(motorTimer, stepMotorFwd);
              else // if(input[n] == 'B')
                MsTimer2::set(motorTimer, stepMotorBck);
              MsTimer2::start();
            }

            n+=3;
          }
        }
      }
      
      for(int i=0; i<NUM_PIXELS; i++)
      {
        if(n <= charsRead)  
        {
          if(input[n++] == '#')   // received color data
          {
            r = charsToHex(input[n++], input[n++]);
            g = charsToHex(input[n++], input[n++]);
            b = charsToHex(input[n++], input[n++]);
    
            pix[i] = strip.Color(r, g, b);
            strip.setPixelColor(i, pix[i]);
          }
        }
      }
      strip.show();
    }
  }
  
  if(millis() - sensorReadMs > 100)
  {
    sensorVal = analogRead(SENSOR_SIG);
    sensorVal = map(sensorVal, 0, 1023, 0, 255);
    btnVal = digitalRead(BTN_SIG);
    
    Serial.print("S1:");
    Serial.print(sensorVal);
    Serial.print(",B1:");
    Serial.print(btnVal);
    Serial.println();
    
    sensorReadMs = millis();
  }
}

int charsToHex(char msb, char lsb)
{
  char str[3];
  str[0] = lsb;
  str[1] = msb;
  str[2] = '\0';
  return (int)strtol(str, 0, 16);
}

void colorWipe(uint32_t c, uint8_t wait) {
  for(uint16_t i=0; i<strip.numPixels(); i++) {
    strip.setPixelColor(i, c);
    strip.show();
    delay(wait);
  }
}

void stepMotorFwd()
{
  stepperMotor.step(1);
  motorPos++;
}

void stepMotorBck()
{
  stepperMotor.step(-1);
  motorPos--;
}
