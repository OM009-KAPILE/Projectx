enum Environment { development, staging, production }

class AppConfig {
  static const String _envString = String.fromEnvironment('ENV', defaultValue: 'development');
  
  static Environment get environment {
    switch (_envString.toLowerCase()) {
      case 'production':
      case 'prod':
        return Environment.production;
      case 'staging':
      case 'stage':
        return Environment.staging;
      case 'development':
      case 'dev':
      default:
        return Environment.development;
    }
  }

  static const String _customBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_customBaseUrl.isNotEmpty) {
      return _customBaseUrl;
    }
    switch (environment) {
      case Environment.production:
        return 'https://api.projectx.edu/api/v1';
      case Environment.staging:
        return 'https://staging-api.projectx.edu/api/v1';
      case Environment.development:
      default:
        return 'http://10.0.2.2:4000/api/v1'; // 10.0.2.2 for Android Emulator, localhost for iOS
    }
  }

  static const String appName = 'ProjectX';
  static const String appVersion = '1.0.0';
  static const int buildNumber = 1;
}
