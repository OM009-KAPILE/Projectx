import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import 'reset_password_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final TextEditingController emailController = TextEditingController();
  bool isLoading = false;
  bool isSent = false;
  String? errorMessage;

  Future<void> handleSend() async {
    final email = emailController.text.trim().toLowerCase();
    if (email.isEmpty) return;

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      await ApiClient.post('/auth/forgot-password', {'email': email});
      setState(() => isSent = true);
    } catch (e) {
      setState(() {
        errorMessage = 'Error requesting password reset.';
      });
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: const Color(0xFF22C55E).withOpacity(0.3)),
                ),
                child: const Icon(Icons.key_outlined,
                    color: Color(0xFF4ADE80), size: 24),
              ),
              const SizedBox(height: 16),
              const Text(
                'Forgot Password',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFF8FAFC),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Enter your university email to receive a password reset code.',
                style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 24),

              if (errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: const Color(0xFFEF4444).withOpacity(0.3)),
                  ),
                  child: Text(
                    errorMessage!,
                    style: const TextStyle(
                        fontSize: 12, color: Color(0xFFFCA5A5)),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              if (isSent) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF22C55E).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: const Color(0xFF22C55E).withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Reset Code Sent!',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF4ADE80),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'If an account exists for ${emailController.text}, check your inbox for the 6-digit reset code.',
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFFCBD5E1)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ResetPasswordScreen(
                              email: emailController.text.trim().toLowerCase()),
                        ),
                      );
                    },
                    child: const Text('Enter Reset Code & Update Password'),
                  ),
                ),
              ] else ...[
                TextField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'University Email',
                    hintText: 'student@stanford.edu',
                    prefixIcon: Icon(Icons.mail_outline, size: 18),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : handleSend,
                    child: Text(isLoading
                        ? 'Sending Code...'
                        : 'Send Password Reset Code'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
