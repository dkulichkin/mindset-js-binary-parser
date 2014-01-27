Mindset-js-binary-parser
========================

A nodejs module for parsing binary data for Mindset/Mindwave headsets by Neurosky. A caveat to notice: at the very moment I havn't implemented dynamical device recognition, thus the initial device's ID (tty.MindWaveMobile-DevA) has been hardcoded. Use <code>ls /dev/tty.*</code> (Mac os) to figure out your certain device's ID and substitute it.

Please, familiarise yourself also with my <a href="https://github.com/dkulichkin/twimpress" target="_blank">Twimpress</a> project has been made on top of this parser and representing a basic visualization of headset's data, so thus might be a good part for bootstrapping your further application.
