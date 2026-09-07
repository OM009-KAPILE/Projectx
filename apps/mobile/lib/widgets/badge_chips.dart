import 'package:flutter/material.dart';

class DomainBadgeChip extends StatelessWidget {
  final String domain;
  const DomainBadgeChip({Key? key, required this.domain}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF22C55E).withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF22C55E).withOpacity(0.25)),
      ),
      child: Text(
        domain,
        style: const TextStyle(
          color: Color(0xFF4ADE80),
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class SkillChip extends StatelessWidget {
  final String name;
  final bool isCritical;
  final int? minLevel;

  const SkillChip({
    Key? key,
    required this.name,
    this.isCritical = false,
    this.minLevel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isCritical
            ? const Color(0xFFF43F5E).withOpacity(0.12)
            : const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isCritical
              ? const Color(0xFFF43F5E).withOpacity(0.3)
              : const Color(0xFF334155),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            name,
            style: TextStyle(
              color: isCritical ? const Color(0xFFFDA4AF) : const Color(0xFFCBD5E1),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
          if (minLevel != null) ...[
            const SizedBox(width: 4),
            Text(
              'Lvl $minLevel',
              style: TextStyle(
                color: isCritical
                    ? const Color(0xFFFDA4AF).withOpacity(0.7)
                    : const Color(0xFF94A3B8),
                fontSize: 9,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class HealthBadgeChip extends StatelessWidget {
  final String status;
  final int? score;

  const HealthBadgeChip({Key? key, required this.status, this.score})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color textColor;

    switch (status) {
      case 'EXCELLENT':
      case 'HEALTHY':
        bg = const Color(0xFF22C55E).withOpacity(0.15);
        textColor = const Color(0xFF4ADE80);
        break;
      case 'AT_RISK':
        bg = const Color(0xFFF59E0B).withOpacity(0.15);
        textColor = const Color(0xFFFBBF24);
        break;
      default:
        bg = const Color(0xFFEF4444).withOpacity(0.15);
        textColor = const Color(0xFFF87171);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: textColor.withOpacity(0.3)),
      ),
      child: Text(
        score != null ? '$status ($score%)' : status,
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class PrivacyIndicatorChip extends StatelessWidget {
  final int level; // 1, 2, 3, 4
  final String? label;
  final bool isEncrypted;

  const PrivacyIndicatorChip({
    Key? key,
    this.level = 1,
    this.label,
    this.isEncrypted = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color border;
    Color textColor;
    String text;
    IconData icon;

    switch (level) {
      case 4:
        bg = const Color(0xFFA855F7).withOpacity(0.15);
        border = const Color(0xFFA855F7).withOpacity(0.4);
        textColor = const Color(0xFFC084FC);
        text = label ?? 'LEVEL 4: PROJECT OWNER';
        icon = Icons.admin_panel_settings_rounded;
        break;
      case 3:
        bg = const Color(0xFF3B82F6).withOpacity(0.15);
        border = const Color(0xFF3B82F6).withOpacity(0.4);
        textColor = const Color(0xFF60A5FA);
        text = label ?? 'LEVEL 3: ACCEPTED MEMBER';
        icon = Icons.lock_open_rounded;
        break;
      case 2:
        bg = const Color(0xFFF59E0B).withOpacity(0.15);
        border = const Color(0xFFF59E0B).withOpacity(0.4);
        textColor = const Color(0xFFFBBF24);
        text = label ?? 'LEVEL 2: APPLICANT VIEW';
        icon = Icons.visibility_outlined;
        break;
      case 1:
      default:
        bg = const Color(0xFF22C55E).withOpacity(0.15);
        border = const Color(0xFF22C55E).withOpacity(0.4);
        textColor = const Color(0xFF4ADE80);
        text = label ?? 'LEVEL 1: PUBLIC SAFE LISTING';
        icon = Icons.shield_outlined;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: textColor),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              color: textColor,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
