import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/app_state.dart';
import '../widgets/badge_chips.dart';
import 'notifications_settings_screen.dart';
import 'auth/login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    final user = state.currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = isDark ? AppTheme.brandPrimary : AppTheme.brandPrimaryDark;
    final cardBg = isDark ? AppTheme.cardDark : AppTheme.cardLight;
    final borderCol = isDark ? AppTheme.borderDark : AppTheme.borderLight;
    final textMain = isDark ? AppTheme.textLight : AppTheme.textDark;
    final textMuted = isDark ? AppTheme.textMutedDark : AppTheme.textMutedLight;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Profile & Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Header Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderCol),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: primary,
                    child: Text(
                      user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'S',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0B0F19),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                user?.name ?? 'Student Builder',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: textMain,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const VerificationBadge(size: 16),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.collegeName ?? 'Stanford University',
                          style: TextStyle(
                            fontSize: 12,
                            color: primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          user?.email ?? '',
                          style: TextStyle(fontSize: 11, color: textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Theme Settings Card
            Text(
              'APPEARANCE',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: textMuted,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderCol),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded, size: 20, color: primary),
                      const SizedBox(width: 12),
                      Text('Dark Mode', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: textMain)),
                    ],
                  ),
                  Switch(
                    value: isDark,
                    activeColor: primary,
                    onChanged: (val) {
                      state.setThemeMode(val ? ThemeMode.dark : ThemeMode.light);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Verified Skill Evidence Card
            Text(
              'VERIFIED SKILLS & EVIDENCE',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: textMuted,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderCol),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.code_rounded, size: 18, color: AppTheme.brandAccent),
                      const SizedBox(width: 8),
                      Text('GitHub Evidence Connected', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textMain)),
                      const Spacer(),
                      Text('Confidence: HIGH', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: primary)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: const [
                      SkillConfidencePill(skillName: 'PyTorch', level: 'HIGH (88%)'),
                      SkillConfidencePill(skillName: 'React / TS', level: 'HIGH (82%)'),
                      SkillConfidencePill(skillName: 'Graph Neural Networks', level: 'HIGH (85%)'),
                      SkillConfidencePill(skillName: 'Distributed Systems', level: 'MEDIUM (65%)'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Settings Menu Items
            Text(
              'ACCOUNT & SECURITY',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: textMuted,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderCol),
              ),
              child: Column(
                children: [
                  _buildSettingsTile(
                    icon: Icons.notifications_none_rounded,
                    title: 'Notification Preferences',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const NotificationsSettingsScreen()),
                      );
                    },
                    textMain: textMain,
                    borderCol: borderCol,
                  ),
                  _buildSettingsTile(
                    icon: Icons.lock_outline_rounded,
                    title: 'Privacy & College Visibility',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('🔒 Privacy setting: Projects visible to all verified partner colleges.')),
                      );
                    },
                    textMain: textMain,
                    borderCol: borderCol,
                  ),
                  _buildSettingsTile(
                    icon: Icons.support_agent_rounded,
                    title: 'Help & Safety Center',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Support contact: support@projectx.edu')),
                      );
                    },
                    textMain: textMain,
                    borderCol: borderCol,
                  ),
                  _buildSettingsTile(
                    icon: Icons.logout_rounded,
                    title: 'Log Out',
                    iconColor: AppTheme.brandRose,
                    titleColor: AppTheme.brandRose,
                    isLast: true,
                    onTap: () => _confirmLogout(context, state),
                    textMain: textMain,
                    borderCol: borderCol,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Center(
              child: Text(
                'ProjectX Mobile • Version 1.0.0 (Build 1)',
                style: TextStyle(fontSize: 11, color: textMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    required Color textMain,
    required Color borderCol,
    Color? iconColor,
    Color? titleColor,
    bool isLast = false,
  }) {
    return Column(
      children: [
        ListTile(
          leading: Icon(icon, size: 20, color: iconColor ?? textMain),
          title: Text(
            title,
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: titleColor ?? textMain),
          ),
          trailing: const Icon(Icons.chevron_right_rounded, size: 20),
          onTap: onTap,
          dense: true,
        ),
        if (!isLast) Divider(height: 1, color: borderCol),
      ],
    );
  }

  void _confirmLogout(BuildContext context, AppState state) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Log Out'),
        content: const Text('Are you sure you want to log out of your student account?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.brandRose,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await state.logout();
              if (context.mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}
