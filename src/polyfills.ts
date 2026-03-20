import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
global.process = require('process');
global.net = require('react-native-tcp-socket');
global.tls = require('react-native-tcp-socket');
