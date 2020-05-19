var request = require("request");
var Service, Characteristic;

var active = 0;
var state = 0;
var targetState = 0;
var temperature;
var coolingThreshold = 18;
var swingMode = 1;
var rotationSpeed = "high";
var rotationSpeedInt = 100;

const { execSync } = require('child_process');

var command = "ir-ctl --device=/dev/lirc0 --send=/home/pi/homebridge_plugins/homebridge-ac/ir-signals/";

var dhtCommand = "python /home/pi/homebridge_plugins/homebridge-ac/dht.py";

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-ac", "AirConditioner", AirConditionerAccessory);
}

function AirConditionerAccessory(log, config) {
  this.log = log;
  this.name = config["air_conditioner"];
  
  this.service = new Service.HeaterCooler(this.name);
  
  this.service
    .getCharacteristic(Characteristic.Active)
    .on('get', this.getActive.bind(this))
    .on('set', this.setActive.bind(this));
  
  this.service
    .getCharacteristic(Characteristic.CurrentHeaterCoolerState)
    .on('get', this.getState.bind(this));
  
  this.service
    .getCharacteristic(Characteristic.TargetHeaterCoolerState)
    .on('get', this.getTargetState.bind(this))
    .on('set', this.setTargetState.bind(this));

  this.service
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getTemperature.bind(this));

  this.service
    .getCharacteristic(Characteristic.SwingMode)
    .on('get', this.getSwingMode.bind(this))
    .on('set', this.setSwingMode.bind(this));

  this.service
    .getCharacteristic(Characteristic.RotationSpeed)
    .on('get', this.getRotationSpeed.bind(this))
    .on('set', this.setRotationSpeed.bind(this));

  this.service
    .getCharacteristic(Characteristic.CoolingThresholdTemperature)
    .on('get', this.getCoolingThreshold.bind(this))
    .on('set', this.setCoolingThreshold.bind(this));

}

AirConditionerAccessory.prototype.getActive = function(callback) {
  this.log("Get active: %s", active);
  callback(null, active);
}

AirConditionerAccessory.prototype.setActive = function(_active, callback) {
  if (active != _active) {
    active = _active;
    if (active == Characteristic.Active.ACTIVE) {
      let stdout = execSync(command+"power_on");
      state = Characteristic.CurrentHeaterCoolerState.COOLING;
      targetState = Characteristic.TargetHeaterCoolerState.COOL;
      swingMode = Characteristic.SwingMode.SWING_ENABLED;
      rotationSpeed = "high";
      rotationSpeedInt = 100;
      coolingThreshold = 18;
    } else {
      let stdout = execSync(command+"power_off");
    }
  }
  this.log("Set active: %s", active);
  callback(null);
}

AirConditionerAccessory.prototype.getState = function(callback) {
  if (active == 0) {
    state = Characteristic.CurrentHeaterCoolerState.INACTIVE;
  } else {
    state = targetState + 1;
  }
  this.log("Get state: %s", state);
  callback(null, state);
}

AirConditionerAccessory.prototype.getTargetState = function(callback) {
  this.log("Get targetState: %s", targetState);
  callback(null, targetState);
}

AirConditionerAccessory.prototype.setTargetState = function(_targetState, callback) {
  if (targetState != _targetState) {
    targetState = _targetState;
    if (targetState == Characteristic.TargetHeaterCoolerState.HEAT) {
      let stdout = execSync(command+rotationSpeed+"_dehumid");
    } else {
      let stdout = execSync(command+rotationSpeed+"_"+coolingThreshold);
    }
  }
  this.log("Set targetState: %s", targetState);
  callback(null);
}

AirConditionerAccessory.prototype.getTemperature = function(callback) {
  let stdout = execSync(dhtCommand);
  if (isNaN(stdout)) {
    this.log("ERROR: fail to get temperature.");
  } else {
    temperature = stdout;
    this.log("Get temperature: %s", temperature);
  }
  callback(null, temperature);
}

AirConditionerAccessory.prototype.getCoolingThreshold = function(callback) {
  this.log("Get threshold: %s", coolingThreshold);
  callback(null, coolingThreshold);
}

AirConditionerAccessory.prototype.setCoolingThreshold = function(_threshold, callback) {
  coolingThreshold = _threshold - _threshold % 1;
  if (coolingThreshold < 18) {
    coolingThreshold = 18;
  } else if (coolingThreshold > 30) {
    coolingThreshold = 30;
  }
  let stdout = execSync(command+rotationSpeed+"_"+coolingThreshold);
  this.log("Set coolingThreshold: %s", coolingThreshold);
  callback(null);
}

AirConditionerAccessory.prototype.getSwingMode = function(callback) {
  this.log("Get swingMode: %s", swingMode);
  callback(null, swingMode);
}

AirConditionerAccessory.prototype.setSwingMode = function(_swingMode, callback) {
  if (swingMode != _swingMode) {
    swingMode = _swingMode;
    let stdout = execSync(command+"swing");
  }
  this.log("Set swingMode: %s", swingMode);
  callback(null);
}

AirConditionerAccessory.prototype.getRotationSpeed = function(callback) {
  rotationSpeed = (rotationSpeedInt > 50) ? "high" : "low";
  this.log("Get rotationSpeed: %s (%s)", rotationSpeedInt, rotationSpeed);
  callback(null, rotationSpeedInt);
}

AirConditionerAccessory.prototype.setRotationSpeed = function(_rotationSpeed, callback) {
  rotationSpeedInt = _rotationSpeed;
  rotationSpeed = (rotationSpeedInt > 50) ? "high" : "low";
  let stdout = execSync(command+rotationSpeed+"_"+coolingThreshold);
  this.log("Set rotationSpeed: %s (%s)", rotationSpeedInt, rotationSpeed);
  callback(null);
}

AirConditionerAccessory.prototype.getServices = function() {
  return [this.service];
}
