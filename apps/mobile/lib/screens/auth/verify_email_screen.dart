import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../models/user.dart';
import '../../providers/app_state.dart';
import 'success_screen.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String email;
  const VerifyEmailScreen({Key? key, required this.email}) : super(key: key);

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final List<TextEditingController> controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> focusNodes = List.generate(6, (_) => FocusNode());

  int countdown = 60;
  Timer? timer;
  bool isLoading = false;
  String? errorMessage;
  String? infoMessage;

  @override
  void initState() {
    super.initState();
    startTimer();
  }

  void startTimer() {
    countdown = 60;
    timer?.cancel();
    timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (countdown > 0) {
        setState(() => countdown--);
      } else {
        t.cancel();
      }
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    for (var c in controllers) {
      c.dispose();
    }
    for (var f in focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  Future<void> handleVerify() async {
    final code = controllers.map((c) => c.text).join();
    if (code.length != 6) return;

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final res = await ApiClient.post('/auth/verify-email', {
        'email': widget.email,
        'code': code,
      });

      if (res['success'] == true) {
        ApiClient.authToken = res['data']['tokens']['accessToken'];
        final state = Provider.of<AppState>(context, listen: false);
        state.currentUser = UserModel.fromJson(res['data']['user']);

        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => SuccessScreen(
              userName: state.currentUser?.name ?? 'Builder',
            ),
          ),
        );
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Invalid or expired verification code.';
      });
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> handleResend() async {
    if (countdown > 0) return;

    try {
      await ApiClient.post('/auth/resend-verification', {
        'email': widget.email,
      });
      setState(() {
        infoMessage = 'Fresh verification code sent to your email.';
      });
      startTimer();
    } catch (e) {
      setState(() {
        errorMessage = 'Error resending verification code.';
      });
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
                child: const Icon(Icons.mail_outline,
                    color: Color(0xFF4ADE80), size: 24),
              ),
              const SizedBox(height: 16),
              const Text(
                'Verify University Email',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFF8FAFC),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'We sent a 6-digit code to ${widget.email}',
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

              if (infoMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF22C55E).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: const Color(0xFF22C55E).withOpacity(0.3)),
                  ),
                  child: Text(
                    infoMessage!,
                    style: const TextStyle(
                        fontSize: 12, color: Color(0xFF86EFAC)),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // 6 Digits
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (i) {
                  return SizedBox(
                    width: 44,
                    height: 52,
                    child: TextField(
                      controller: controllers[i],
                      focusNode: focusNodes[i],
                      textAlign: TextAlign.center,
                      keyboardType: TextInputType.number,
                      maxLength: 1,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'monospace',
                        color: Color(0xFFF8FAFC),
                      ),
                      decoration: const InputDecoration(
                        counterText: '',
                        contentPadding: EdgeInsets.zero,
                      ),
                      onChanged: (val) {
                        if (val.isNotEmpty && i < 5) {
                          focusNodes[i + 1].requestFocus();
                        } else if (val.isEmpty && i > 0) {
                          focusNodes[i - 1].requestFocus();
                        }
                        if (i == 5 && val.isNotEmpty) {
                          handleVerify();
                        }
                      },
                    ),
                  );
                }),
              ),

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLoading ? null : handleVerify,
                  child: Text(isLoading
                      ? 'Verifying...'
                      : 'Verify Email & Activate'),
                ),
              ),

              const SizedBox(height: 20),

              Center(
                child: TextButton(
                  onPressed: countdown == 0 ? handleResend : null,
                  child: Text(
                    countdown > 0
                        ? 'Resend Code in ${countdown}s'
                        : 'Resend Verification Code',
                    style: TextStyle(
                      color: countdown == 0
                          ? const Color(0xFF4ADE80)
                          : const Color(0xFF64748B),
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
