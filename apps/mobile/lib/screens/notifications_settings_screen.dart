import 'package:flutter/material.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  // Global channel toggles
  bool inAppEnabled = true;
  bool emailEnabled = true;
  bool pushEnabled = true;

  // 10 Notification Categories
  bool notifyNewApp = true;
  bool notifyAppStatus = true;
  bool notifyTeamInvite = true;
  bool notifyNewMessage = true;
  bool notifyTaskAssigned = true;
  bool notifyTaskDeadline = true;
  bool notifyHealthWarning = true;
  bool notifySkillGap = true;
  bool notifyMilestone = true;

  bool isSaving = false;

  final List<Map<String, dynamic>> mockNotifications = [
    {
      'id': '1',
      'type': 'PROJECT_HEALTH_WARNING',
      'title': 'Project Health Alert',
      'message': 'AeroRoute AI health dropped to MEDIUM due to 1 overdue task.',
      'time': '10 mins ago',
      'isRead': false,
    },
    {
      'id': '2',
      'type': 'NEW_APPLICATION',
      'title': 'New Application Received',
      'message': 'Bob Miller applied for GNN Trajectory Specialist.',
      'time': '2 hours ago',
      'isRead': false,
    },
    {
      'id': '3',
      'type': 'MILESTONE_COMPLETED',
      'title': 'Milestone Completed! 🚀',
      'message': 'Phase 1: Architecture & Model Validation was marked complete.',
      'time': 'Yesterday',
      'isRead': true,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Notifications & Channels'),
          bottom: const TabBar(
            indicatorColor: Color(0xFF22C55E),
            tabs: [
              Tab(icon: Icon(Icons.notifications_outlined, size: 18), text: 'Feed'),
              Tab(icon: Icon(Icons.tune, size: 18), text: 'Preferences'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildNotificationFeedTab(),
            _buildPreferencesTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationFeedTab() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: const Color(0xFF111827),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Alerts & Updates',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8)),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    for (var n in mockNotifications) {
                      n['isRead'] = true;
                    }
                  });
                },
                child: const Text('Mark all read', style: TextStyle(fontSize: 11, color: Color(0xFF4ADE80))),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.separated(
            itemCount: mockNotifications.length,
            separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFF1F293D)),
            itemBuilder: (context, index) {
              final n = mockNotifications[index];
              final isRead = n['isRead'] == true;

              return Container(
                color: isRead ? Colors.transparent : const Color(0xFF22C55E).withOpacity(0.05),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFF1F293D),
                    child: Icon(
                      _getIconForType(n['type']),
                      color: const Color(0xFF4ADE80),
                      size: 20,
                    ),
                  ),
                  title: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        n['title'],
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isRead ? FontWeight.w600 : FontWeight.w800,
                          color: const Color(0xFFF8FAFC),
                        ),
                      ),
                      Text(
                        n['time'],
                        style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      n['message'],
                      style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                    ),
                  ),
                  onTap: () {
                    setState(() {
                      n['isRead'] = true;
                    });
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPreferencesTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // SECTION 1: GLOBAL CHANNELS
        const Text(
          '1. DELIVERY CHANNELS',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8), letterSpacing: 0.8),
        ),
        const SizedBox(height: 10),
        _buildChannelSwitch('In-App Alerts', 'Real-time WebSocket & banner alerts', inAppEnabled, (v) => setState(() => inAppEnabled = v)),
        _buildChannelSwitch('Email Notifications', 'Dispatched to verified student email', emailEnabled, (v) => setState(() => emailEnabled = v)),
        _buildChannelSwitch('Mobile Push Notifications', 'APNs & FCM device token architecture', pushEnabled, (v) => setState(() => pushEnabled = v)),

        const SizedBox(height: 24),

        // SECTION 2: 10 NOTIFICATION TYPES
        const Text(
          '2. TRIGGER RULES (10 CATEGORIES)',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8), letterSpacing: 0.8),
        ),
        const SizedBox(height: 10),
        _buildTypeSwitch('New Application', 'When a candidate applies to your project', notifyNewApp, (v) => setState(() => notifyNewApp = v)),
        _buildTypeSwitch('Application Decisions', 'When applications are accepted or rejected', notifyAppStatus, (v) => setState(() => notifyAppStatus = v)),
        _buildTypeSwitch('Team Invitations', 'Direct invitations from project creators', notifyTeamInvite, (v) => setState(() => notifyTeamInvite = v)),
        _buildTypeSwitch('New Messages', 'Direct messages and workspace team discussions', notifyNewMessage, (v) => setState(() => notifyNewMessage = v)),
        _buildTypeSwitch('Task Assigned', 'When sprint tasks are assigned to you', notifyTaskAssigned, (v) => setState(() => notifyTaskAssigned = v)),
        _buildTypeSwitch('Task Deadline Approaching', '24-hour reminder before task due date', notifyTaskDeadline, (v) => setState(() => notifyTaskDeadline = v)),
        _buildTypeSwitch('Project Health Warning', 'Risk level escalations & overdue sprint velocity', notifyHealthWarning, (v) => setState(() => notifyHealthWarning = v)),
        _buildTypeSwitch('Skill Gap Detected', 'Critical skill shortfalls in project formation', notifySkillGap, (v) => setState(() => notifySkillGap = v)),
        _buildTypeSwitch('Milestone Completed', 'Celebration when roadmap deliverables finish', notifyMilestone, (v) => setState(() => notifyMilestone = v)),

        const SizedBox(height: 24),

        ElevatedButton(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            backgroundColor: const Color(0xFF22C55E),
            foregroundColor: const Color(0xFF0B0F19),
          ),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Preferences saved successfully.')),
            );
          },
          child: const Text('Save Notification Preferences', style: TextStyle(fontWeight: FontWeight.w800)),
        ),
      ],
    );
  }

  Widget _buildChannelSwitch(String title, String subtitle, bool val, Function(bool) onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1F293D)),
      ),
      child: SwitchListTile(
        title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFFF8FAFC))),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
        value: val,
        activeColor: const Color(0xFF22C55E),
        onChanged: onChanged,
        contentPadding: EdgeInsets.zero,
      ),
    );
  }

  Widget _buildTypeSwitch(String title, String subtitle, bool val, Function(bool) onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1F293D)),
      ),
      child: SwitchListTile(
        title: Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFE2E8F0))),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
        value: val,
        activeColor: const Color(0xFF22C55E),
        onChanged: onChanged,
        contentPadding: EdgeInsets.zero,
      ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'PROJECT_HEALTH_WARNING':
        return Icons.speed;
      case 'NEW_APPLICATION':
        return Icons.person_add_outlined;
      case 'MILESTONE_COMPLETED':
        return Icons.flag_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }
}
