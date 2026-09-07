import 'package:flutter/material.dart';
import '../models/project.dart';
import '../widgets/badge_chips.dart';

import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../widgets/empty_state_widget.dart';

class WorkspaceScreen extends StatefulWidget {
  final ProjectModel? project;
  const WorkspaceScreen({Key? key, this.project}) : super(key: key);

  @override
  State<WorkspaceScreen> createState() => _WorkspaceScreenState();
}

class _WorkspaceScreenState extends State<WorkspaceScreen> {
  int activeTabIndex = 0;

  final List<Map<String, dynamic>> mockTasks = [
    {
      'title': 'Design Dispatcher HUD & Mapbox Flight View',
      'status': 'DONE',
      'priority': 'HIGH',
      'assignee': 'Alice (Stanford)',
    },
    {
      'title': 'Train Graph Neural Network Trajectory Model',
      'status': 'IN_PROGRESS',
      'priority': 'URGENT',
      'assignee': 'Bob (MIT)',
    },
    {
      'title': 'PX4 Autopilot MAVLink Telemetry Bridge in C++',
      'status': 'TODO',
      'priority': 'HIGH',
      'assignee': 'Rohan (IIT Bombay)',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    final effectiveProject = widget.project ?? (state.projects.isNotEmpty ? state.projects.first : null);

    if (effectiveProject == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Team Workspace')),
        body: EmptyStateWidget(
          icon: Icons.folder_open_rounded,
          title: 'No Active Projects',
          message: 'Join a project or create a new team to unlock your Kanban sprint workspace.',
          buttonText: 'Discover Projects',
          onButtonPressed: () => Navigator.pop(context),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(effectiveProject.title),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: HealthBadgeChip(
              status: effectiveProject.healthStatus,
              score: effectiveProject.healthScore,
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Segmented Tab Switcher
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _buildTabButton(0, 'Sprint Tasks'),
                const SizedBox(width: 8),
                _buildTabButton(1, 'AI Skill Gaps'),
                const SizedBox(width: 8),
                _buildTabButton(2, 'Health & Velocity'),
              ],
            ),
          ),

          Expanded(
            child: activeTabIndex == 0
                ? _buildTasksView()
                : activeTabIndex == 1
                    ? _buildSkillGapsView()
                    : _buildHealthView(),
          ),
        ],
      ),
    );
  }

  Widget _buildTabButton(int index, String label) {
    final isSelected = activeTabIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => activeTabIndex = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF22C55E) : const Color(0xFF111827),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? const Color(0xFF22C55E) : const Color(0xFF1F293D),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? const Color(0xFF0B0F19) : const Color(0xFF94A3B8),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTasksView() {
    final completedCount = mockTasks.where((t) => t['status'] == 'DONE').length;
    final progress = mockTasks.isNotEmpty ? ((completedCount / mockTasks.length) * 100).round() : 0;

    return Column(
      children: [
        // Sprint Progress Card
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF1F293D)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'SPRINT PROGRESS',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8)),
                  ),
                  Text(
                    '$progress% ($completedCount/${mockTasks.length} Completed)',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF4ADE80)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress / 100.0,
                  minHeight: 6,
                  backgroundColor: const Color(0xFF0B0F19),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF22C55E)),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            itemCount: mockTasks.length,
            itemBuilder: (context, index) {
              final t = mockTasks[index];
              final isDone = t['status'] == 'DONE';
              final status = t['status'] as String;

              Color statusColor = const Color(0xFF94A3B8);
              if (status == 'DONE') statusColor = const Color(0xFF22C55E);
              else if (status == 'IN_PROGRESS') statusColor = const Color(0xFFF59E0B);
              else if (status == 'IN_REVIEW') statusColor = const Color(0xFFA855F7);

              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Icon(
                        isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                        color: isDone ? const Color(0xFF22C55E) : const Color(0xFF94A3B8),
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t['title'],
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isDone ? const Color(0xFF94A3B8) : const Color(0xFFF8FAFC),
                                decoration: isDone ? TextDecoration.lineThrough : null,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: statusColor.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: statusColor.withOpacity(0.3)),
                                  ),
                                  child: Text(
                                    status.replaceAll('_', ' '),
                                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: statusColor),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Assigned to ${t['assignee']}',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSkillGapsView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Headline Gap Alert
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF43F5E).withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Expanded(
                      child: Text(
                        'Your team is missing 2 critical skills.',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFFDA4AF),
                        ),
                      ),
                    ),
                    Text(
                      '80%',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF4ADE80),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Missing: Computer Vision (Level 3 • 1 person needed)',
                  style: TextStyle(fontSize: 11, color: Color(0xFFCBD5E1)),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Finding verified student matches across colleges...')),
                      );
                    },
                    icon: const Icon(Icons.people_outline, size: 16),
                    label: const Text('Find Matching Students', style: TextStyle(fontSize: 12)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Visual Team Skill Coverage Matrix
          const Text(
            'VISUAL TEAM SKILL COVERAGE',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF38BDF8)),
          ),
          const SizedBox(height: 8),
          _buildCategoryCoverageRow('Backend', 100, false),
          _buildCategoryCoverageRow('Flutter', 100, false),
          _buildCategoryCoverageRow('UI/UX', 100, false),
          _buildCategoryCoverageRow('ML', 50, true),

          const SizedBox(height: 16),

          // 1. Covered Skills
          const Text(
            'COVERED SKILLS (3)',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF4ADE80)),
          ),
          const SizedBox(height: 8),
          _buildGapRow('Flutter', 'Covered by Alice (Stanford)', true),
          _buildGapRow('UI/UX', 'Covered by Alice (Stanford)', true),
          _buildGapRow('PostgreSQL', 'Covered by Alice (Stanford)', true),

          const SizedBox(height: 16),

          // 2. Missing Skills
          const Text(
            'MISSING CRITICAL SKILLS (1)',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFFDA4AF)),
          ),
          const SizedBox(height: 8),
          _buildGapRow('Computer Vision', 'Level 3 • 1 person needed', false),

          const SizedBox(height: 16),

          // 3. Overlapping Skills
          const Text(
            'OVERLAPPING / REDUNDANT (1)',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF818CF8)),
          ),
          const SizedBox(height: 8),
          _buildGapRow('Git & GitHub', '2 members have proficiency', true),

          const SizedBox(height: 24),

          // 4. Intelligent Cross-College Matches
          const Text(
            'RECOMMENDED CROSS-COLLEGE STUDENTS',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF4ADE80)),
          ),
          const SizedBox(height: 8),
          _buildCandidateCard(
            'Bob Chen',
            'MIT CSAIL',
            94,
            [
              '✓ Has required Python & Computer Vision skills',
              '✓ Available 10-20 hours/week',
              '✓ Interested in Applied AI',
              '✓ Has completed 3 relevant projects',
            ],
            ['Python', 'Computer Vision', 'PyTorch'],
          ),
          const SizedBox(height: 12),
          _buildCandidateCard(
            'Sarah Connor',
            'UC Berkeley',
            88,
            [
              '✓ Has required Flutter & REST APIs skills',
              '✓ Available 8 hours/week',
              '✓ Interested in Mobile & Edge AI',
              '✓ Has completed 2 relevant projects',
            ],
            ['Flutter', 'REST APIs', 'PostgreSQL'],
          ),
        ],
      ),
    );
  }

  Widget _buildCandidateCard(
    String name,
    String college,
    int score,
    List<String> reasons,
    List<String> skills,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1F293D)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFFF8FAFC)),
                  ),
                  Text(
                    college,
                    style: const TextStyle(fontSize: 11, color: Color(0xFF4ADE80), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF22C55E).withOpacity(0.4)),
                ),
                child: Text(
                  '$score% Match',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF4ADE80)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF0B0F19),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Why this match?',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 4),
                ...reasons.map((r) => Padding(
                      padding: const EdgeInsets.only(bottom: 2),
                      child: Text(
                        r,
                        style: const TextStyle(fontSize: 10, color: Color(0xFFCBD5E1)),
                      ),
                    )),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Viewing student profile for $name')),
                    );
                  },
                  child: const Text('View Profile', style: TextStyle(fontSize: 11)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Invitation dispatched to $name!')),
                    );
                  },
                  child: const Text('Invite', style: TextStyle(fontSize: 11)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCoverageRow(String category, int percentage, bool hasWarning) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: hasWarning ? const Color(0xFFF59E0B).withOpacity(0.08) : const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasWarning ? const Color(0xFFF59E0B).withOpacity(0.3) : const Color(0xFF1F293D),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                category,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFF8FAFC)),
              ),
              Text(
                '$percentage% ${hasWarning ? "⚠️" : "✓"}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: percentage == 100 ? const Color(0xFF4ADE80) : const Color(0xFFF59E0B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percentage / 100.0,
              minHeight: 5,
              backgroundColor: const Color(0xFF0B0F19),
              valueColor: AlwaysStoppedAnimation<Color>(
                percentage == 100 ? const Color(0xFF22C55E) : const Color(0xFFF59E0B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGapRow(String role, String status, bool isFilled) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1F293D)),
      ),
      child: Row(
        children: [
          Icon(
            isFilled ? Icons.check_circle_outline : Icons.warning_amber_rounded,
            color: isFilled ? const Color(0xFF22C55E) : const Color(0xFFF43F5E),
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              role,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFF8FAFC)),
            ),
          ),
          Text(
            status,
            style: TextStyle(
              fontSize: 11,
              color: isFilled ? const Color(0xFF94A3B8) : const Color(0xFFFDA4AF),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Health Score & Risk Header Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1F293D)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'PROJECT HEALTH INTELLIGENCE',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF38BDF8)),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Project Health: 78%',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFFF8FAFC)),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF22C55E).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF22C55E).withOpacity(0.4)),
                  ),
                  child: const Text(
                    'LOW RISK',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF4ADE80)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 5 Core Diagnostic Factor Rows
          const Text(
            'DIAGNOSTIC FACTOR BREAKDOWN',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 8),
          _buildCategoryCoverageRow('Team Completeness', 85, false),
          _buildCategoryCoverageRow('Task Progress', 67, false),
          _buildCategoryCoverageRow('Deadline Risk', 90, false),
          _buildCategoryCoverageRow('Skill Coverage', 80, true),
          _buildCategoryCoverageRow('Milestone Progress', 75, false),

          const SizedBox(height: 16),

          // AI & Rule-based Recommendations
          const Text(
            'ACTIONABLE RECOMMENDATIONS',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF4ADE80)),
          ),
          const SizedBox(height: 8),
          _buildRecommendationCard(
            'AI module is behind schedule.',
            'MEDIUM',
            const Color(0xFFF59E0B),
          ),
          const SizedBox(height: 8),
          _buildRecommendationCard(
            'Two tasks are overdue.',
            'HIGH',
            const Color(0xFFF43F5E),
          ),
          const SizedBox(height: 8),
          _buildRecommendationCard(
            'Consider assigning another member to testing.',
            'LOW',
            const Color(0xFF22C55E),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationCard(String message, String severity, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1F293D)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 8,
            height: 8,
            margin: const EdgeInsets.only(top: 4, right: 10),
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(fontSize: 12, color: Color(0xFFF8FAFC), height: 1.3),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            severity,
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: color),
          ),
        ],
      ),
    );
  }
}
