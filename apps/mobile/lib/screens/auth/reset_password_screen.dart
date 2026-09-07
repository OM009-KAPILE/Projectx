import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import 'login_screen.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String email;
  const ResetPasswordScreen({Key? key, required this.email}) : super(key: key);

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final TextEditingController codeController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();

  bool showPassword = false;
  bool showConfirm = false;
  bool isLoading = false;
  bool isSuccess = false;
  String? errorMessage;

  Future<void> handleReset() async {
    final token = codeController.text.trim();
    final newPassword = passwordController.text.trim();
    final confirm = confirmPasswordController.text.trim();

    if (token.isEmpty || newPassword.isEmpty) return;

    if (newPassword != confirm) {
      setState(() => errorMessage = 'Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setState(() => errorMessage = 'Password must be at least 6 characters.');
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final res = await ApiClient.post('/auth/reset-password', {
        'email': widget.email,
        'token': token,
        'newPassword': newPassword,
      });

      if (res['success'] == true) {
        setState(() => isSuccess = true);
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Invalid or expired password reset code.';
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
        child: SingleChildScrollView(
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
                child: const Icon(Icons.lock_reset,
                    color: Color(0xFF4ADE80), size: 24),
              ),
              const SizedBox(height: 16),
              const Text(
                'Reset Password',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFF8FAFC),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Enter the 6-digit code sent to ${widget.email}',
                style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
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

              if (isSuccess) ...[
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
                    children: const [
                      Text(
                        'Password Updated Successfully!',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF4ADE80),
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'You can now sign in with your new credentials.',
                        style: TextStyle(
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
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const LoginScreen()),
                        (route) => false,
                      );
                    },
                    child: const Text('Sign In with New Password'),
                  ),
                ),
              ] else ...[
                TextField(
                  controller: codeController,
                  decoration: const InputDecoration(
                    labelText: '6-Digit Reset Code',
                    hintText: 'e.g. 592810',
                    prefixIcon: Icon(Icons.key_outlined, size: 18),
                  ),
                ),
                const SizedBox(height: 14),

                TextField(
                  controller: passwordController,
                  obscureText: !showPassword,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    prefixIcon: const Icon(Icons.lock_outline, size: 18),
                    suffixIcon: IconButton(
                      icon: Icon(
                        showPassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 18,
                      ),
                      onPressed: () =>
                          setState(() => showPassword = !showPassword),
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                TextField(
                  controller: confirmPasswordController,
                  obscureText: !showConfirm,
                  decoration: InputDecoration(
                    labelText: 'Confirm New Password',
                    prefixIcon: const Icon(Icons.lock_outline, size: 18),
                    suffixIcon: IconButton(
                      icon: Icon(
                        showConfirm
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 18,
                      ),
                      onPressed: () =>
                          setState(() => showConfirm = !showConfirm),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : handleReset,
                    child: Text(isLoading
                        ? 'Updating...'
                        : 'Reset Password & Proceed'),
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
