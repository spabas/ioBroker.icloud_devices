![Logo](admin/icloud_devices.png)
# ioBroker.icloud_devices

[![NPM version](https://img.shields.io/npm/v/iobroker.icloud_devices.svg)](https://www.npmjs.com/package/iobroker.icloud_devices)
[![Downloads](https://img.shields.io/npm/dm/iobroker.icloud_devices.svg)](https://www.npmjs.com/package/iobroker.icloud_devices)
![Number of Installations](https://iobroker.live/badges/icloud_devices-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/icloud_devices-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.icloud_devices.png?downloads=true)](https://nodei.co/npm/iobroker.icloud_devices/)

**Tests:** ![Test and Release](https://github.com/spabas/ioBroker.icloud_devices/workflows/Test%20and%20Release/badge.svg)

## icloud_devices adapter for ioBroker

Getting information like battery and location for ICloud devices

## Changelog
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->
### 1.0.6 (2023-12-28)
* (spabas) updated modules

### 1.0.5 (2023-12-28)
* (spabas) logging

### 1.0.4 (2023-09-07)
* (spabas) apple api lib config filename has to be settings.json because hard referenced in lib

### 1.0.3 (2023-09-07)
* (spabas) logic was commented out :(

### 1.0.2 (2023-09-07)
* (spabas) bugfix resetting tfa code

### 1.0.1 (2023-09-07)
* (spabas) create config file if not exists

### 1.0.0 (2023-09-07)
* (spabas) read tfa code from tfa-state, overwrite tfa method from lib to provide code not from std imput

### 0.2.0 (2023-07-30)
* (spabas) changed apple icloud api
* Git Ignore
* README

### 0.1.0 (2023-01-28)
* (spabas) initial release

## License
MIT License

Copyright (c) 2023 spabas <bastian.spaeth@gmx.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.