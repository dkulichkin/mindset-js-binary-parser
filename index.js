var SYNC_BYTE = 0xaa,
  EXCODE_BYTE = 0x55,
  POOR_SIGNAL_BYTE = 0x02,
  ATTENTION_BYTE = 0x04,
  MEDITATION_BYTE = 0x05,
  BLINK_STRENGTH_BYTE = 0x16,
  RAW_EEG_BYTE = 0x80,
  ASIC_EEG_BYTE = 0x83;

var rawEegTimeSent = (new Date()).getTime();

var SerialPort = require("serialport").SerialPort;

module.exports = new SerialPort("/dev/tty.MindWaveMobile-DevA", {

  baudrate: 57600,
  parser: function(emitter, rawData) {

    var payLoadLength, packet, checkSum, checkSumExpected, parsedData, rawEeg, eegTick,
      payLoad, extendedCodeLevel, code, bytesParsed, dataLength, dataValue;

    for (var i = 0, l = rawData.length; i < l; i++) {

      if (typeof rawData[i] == 'undefined' || typeof rawData[i+1] == 'undefined' || typeof rawData[i+2] == 'undefined') {
        return;
      }

      payLoadLength = parseInt(rawData[i+2],10);

      if (rawData[i] == SYNC_BYTE && rawData[i+1] == SYNC_BYTE && payLoadLength < 170) {

        packet = rawData.slice(i, i + payLoadLength + 4);
        checkSumExpected = packet[packet.length - 1];
        payLoad = packet.slice(3, -1);
        checkSum = 0;
        payLoad = payLoad.toJSON();
        payLoad.forEach(function(e) { checkSum += e });
        checkSum &= 0xFF;
        checkSum = ~checkSum & 0xFF;

        if (checkSum == checkSumExpected) {
          bytesParsed = 0;
          parsedData = {};
          while (bytesParsed < payLoadLength) {
            extendedCodeLevel = 0;
            while( payLoad[bytesParsed] == EXCODE_BYTE ) {
              extendedCodeLevel++; bytesParsed++;
            }
            code = payLoad[bytesParsed++];

            dataLength = code & 0x80 ? payLoad[bytesParsed++] : 1;
            if (dataLength == 1) {
              dataValue = payLoad[bytesParsed];
            }
            else {
              dataValue = [];
              for(var j = 0; j < dataLength; j++ ) {
                dataValue.push(payLoad[bytesParsed + j]);
              }
            }
            bytesParsed += dataLength;

            if (extendedCodeLevel == 0) {
              switch (code) {
                case POOR_SIGNAL_BYTE:
                  parsedData.poorSignal = dataValue;
                  break;
                case ATTENTION_BYTE:
                  parsedData.attention = dataValue;
                  break;
                case MEDITATION_BYTE:
                  parsedData.meditation = dataValue;
                  break;
                case BLINK_STRENGTH_BYTE:
                  parsedData.blinkStrength = dataValue;
                  break;
                case RAW_EEG_BYTE:
                  eegTick = (new Date()).getTime()
                  if (eegTick - rawEegTimeSent > 200){
                    rawEegTimeSent = eegTick;
                    rawEeg = dataValue[0] * 256 + dataValue[1];
                    rawEeg = rawEeg >=32768 ? rawEeg - 65536 : rawEeg;
                    parsedData.rawEeg = rawEeg;
                  }
                  break;
                case ASIC_EEG_BYTE:
                  parsedData.delta = dataValue[0] * 256 * 256 + dataValue[1] * 256 + dataValue[2];
                  parsedData.theta = dataValue[3] * 256 * 256 + dataValue[4] * 256 + dataValue[5];
                  parsedData.lowAlpha = dataValue[6] * 256 * 256 + dataValue[7] * 256 + dataValue[8];
                  parsedData.highAlpha = dataValue[9] * 256 * 256 + dataValue[10] * 256 + dataValue[11];
                  parsedData.lowBeta = dataValue[12] * 256 * 256 + dataValue[13] * 256 + dataValue[14];
                  parsedData.highBeta = dataValue[15] * 256 * 256 + dataValue[16] * 256 + dataValue[17];
                  parsedData.lowGamma = dataValue[18] * 256 * 256 + dataValue[19] * 256 + dataValue[20];
                  parsedData.highGamma = dataValue[21] * 256 * 256 + dataValue[22] * 256 + dataValue[23];
                  break;
                default:
                  break;

              }
            }
          }

          if (Object.keys(parsedData).length) {
            emitter.emit('data', parsedData);
          }

        }

        i = i + payLoadLength + 3;
      }

    }

  }
}, false);