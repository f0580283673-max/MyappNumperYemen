import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';

class DeviceIdentifier {
  static Future<String> getId() async {
    var deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      var androidInfo = await deviceInfo.androidInfo;
      return androidInfo.id;
    }
    return "unknown";
  }
}