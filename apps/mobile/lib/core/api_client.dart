import 'dart:convert';
import 'package:http/http.dart' as http;
import 'constants.dart';

class ApiClient {
  static String? authToken;

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      };

  static Future<Map<String, dynamic>> get(String endpoint) async {
    final uri = Uri.parse('${AppConstants.baseUrl}$endpoint');
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    }
    throw Exception('API Error: ${response.body}');
  }

  static Future<Map<String, dynamic>> post(
      String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('${AppConstants.baseUrl}$endpoint');
    final response =
        await http.post(uri, headers: _headers, body: jsonEncode(body));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    }
    throw Exception('API Error: ${response.body}');
  }

  static Future<Map<String, dynamic>> patch(
      String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('${AppConstants.baseUrl}$endpoint');
    final response =
        await http.patch(uri, headers: _headers, body: jsonEncode(body));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    }
    throw Exception('API Error: ${response.body}');
  }
}
