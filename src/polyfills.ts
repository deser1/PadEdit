import 'react-native-get-random-values';
import { Buffer } from 'buffer';
(global as any).Buffer = Buffer;
(global as any).process = require('process');
(global as any).net = require('react-native-tcp-socket');
(global as any).tls = require('react-native-tcp-socket');
