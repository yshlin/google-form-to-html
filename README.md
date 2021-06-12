# Google Form to HTML
Ported from [cybercase/google-forms-html-exporter](https://github.com/cybercase/google-forms-html-exporter).

## What does it do?
The purpose of this tool is to extract form fields from [Google Form](https://www.google.com/forms/about/) 
and generate corresponding html for further customization.

## Why would I need it?
The good thing about this is that you can leverage Google Form as your back-end and admin panel, 
customize your own form to fit your design,
and host it on any static web hosting service like [Github Pages](https://pages.github.com/).
Without the need of hosting back-end service.

## How to use it?
In order to provide easy-to-use package, the plan (WIP) is to provide:
 * Web-based interface that can convert google form source code for you online directly.
 * A NPM package that can be easily integrated.

## What if I want to contribute?
This repo is pure JS-based, so it requires fewer dependencies and lower maintenance barrier:
 * Converter: ES6 Javascript both compatible with browser and node.js
 * Template engine: EJS
 * Form handling script: Javascript with JQuery and JQuery-forms plugin 

## What if Google Form changed its implementation?
This is something to consider when relying on implementation that didn't officially get published as API.
Hopefully a daily scheduled test can inform us when it happens. 
