#pragma once

#include "config.h"
#include <WebServer.h>

class WebServerManager {
public:
  static WebServerManager& instance();

  void begin();
  void handleClient();
  void beginMdnsIfNeeded();

private:
  WebServerManager();

  WebServer _server;
  bool _mdnsStarted;
  bool _otaFailed;
  String _otaError;

  void setupRoutes();
  void handleFirmwareUpload();
  void sendJsonResponse(int code, const String& json);
};
