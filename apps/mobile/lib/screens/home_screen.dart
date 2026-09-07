import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/project.dart';
import '../providers/app_state.dart';
import '../widgets/badge_chips.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/empty_state_widget.dart';
import 'workspace_screen.dart';
import 'explore_screen.dart';
import 'notifications_settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? feedData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchFeed();
  }

  Future<void> fetchFeed() async {
    setState(() => isLoading = true);
    try {
      final res = await ApiClient.get('/projects/feed/home');
      if (res['success'] == true) {
        if (mounted) setState(() => feedData = res['data']);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          feedData = {
            'skillGapAlerts': [
              {
                'projectTitle': 'AeroRoute AI',
                'gapRole': 'Embedded Systems & ROS2',
                'criticalSkills': ['ROS2', 'C++'],
              }
            ],
            'recommendedProjects': [
              {
                'id': '1',
                'title': 'AeroRoute AI',
                'domain': 'Robotics & Applied AI',
                'publicTeaser':
                    'Autonomous aerial logistics platform utilizing Graph Neural Networks for dynamic fleet routing and collision avoidance.',
                'difficulty': 'ADVANCED',
                'duration': '8 weeks',
                'teamSize': 4,
                'currentMemberCount': 2,
                'matchPercentage': 94,
                'healthStatus': 'HEALTHY',
                'healthScore': 92,
                'requiredSkills': [
                  {'skillName': 'PyTorch', 'minLevel': 4, 'isCritical': true},
                  {'skillName': 'Graph Neural Networks', 'minLevel': 4, 'isCritical': true},
                ],
              },
              {
                'id': '2',
                'title': 'PulseCare Wearable Engine',
                'domain': 'BioTech & HealthTech',
                'publicTeaser':
                    'Sub-milliwatt edge DSP and arrhythmia detection firmware with BLE synchronization and clinical telemetry.',
                'difficulty': 'INTERMEDIATE',
                'duration': '10 weeks',
                'teamSize': 3,
                'currentMemberCount': 2,
                'matchPercentage': 88,
                'healthStatus': 'HEALTHY',
                'healthScore': 88,
                'requiredSkills': [
                  {'skillName': 'Embedded C', 'minLevel': 4, 'isCritical': true},
                  {'skillName': 'BLE Protocol', 'minLevel': 3, 'isCritical': false},
                ],
              },
            ],
            'activeProjects': [
              {
                'id': '1',
                'title': 'AeroRoute AI',
                'domain': 'Robotics & Applied AI',
                'publicTeaser': 'Autonomous aerial logistics platform with dynamic fleet routing.',
                'healthStatus': 'HEALTHY',
                'healthScore': 92,
                'currentMemberCount': 2,
              }
            ]
          };
        });
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  String getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

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
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: fetchFeed,
          color: primary,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // Offline banner indicator
              if (state.isOfflineMode)
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                    color: AppTheme.brandAmber.withOpacity(0.2),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.wifi_off_rounded, size: 14, color: AppTheme.brandAmber),
                        const SizedBox(width: 8),
                        Text(
                          'Offline Mode - Showing cached recommendations',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.brandAmber),
                        ),
                      ],
                    ),
                  ),
                ),

              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Header Bar
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: primary.withOpacity(0.15),
                                border: Border.all(color: primary.withOpacity(0.4), width: 1.5),
                              ),
                              child: Center(
                                child: Text(
                                  (user?.name ?? 'S').substring(0, 1).toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: primary,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${getGreeting()}, ${user?.name.split(' ').first ?? 'Builder'} 👋',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: textMain,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Text(
                                      user?.collegeName ?? 'Stanford University',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: primary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const VerificationBadge(size: 14),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                        IconButton(
                          tooltip: 'Notifications Settings',
                          icon: Icon(Icons.notifications_none_rounded, color: textMuted),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const NotificationsSettingsScreen()),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Quick Stats Banner
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isDark
                              ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                              : [const Color(0xFFF1F5F9), const Color(0xFFE2E8F0)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: borderCol),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatItem('Active Teams', '1', Icons.group_work_rounded, primary, textMain, textMuted),
                          Container(width: 1, height: 36, color: borderCol),
                          _buildStatItem('Matched Roles', '4', Icons.auto_awesome_rounded, AppTheme.brandAccent, textMain, textMuted),
                          Container(width: 1, height: 36, color: borderCol),
                          _buildStatItem('Health Score', '92%', Icons.favorite_rounded, AppTheme.brandRose, textMain, textMuted),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Active Team Workspace Card
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Your Active Workspace',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: textMain,
                            letterSpacing: -0.2,
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => WorkspaceScreen(
                                  project: state.projects.isNotEmpty ? state.projects.first : null,
                                ),
                              ),
                            );
                          },
                          child: Text('Open Kanban →', style: TextStyle(color: primary, fontWeight: FontWeight.w700, fontSize: 13)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _buildActiveWorkspaceCard(context, isDark, primary, cardBg, borderCol, textMain, textMuted, state),
                    const SizedBox(height: 28),

                    // Recommended Cross-College Opportunities
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Recommended Matches',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: textMain,
                            letterSpacing: -0.2,
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const ExploreScreen()),
                            );
                          },
                          child: Text('View All', style: TextStyle(color: primary, fontWeight: FontWeight.w700, fontSize: 13)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    if (isLoading) ...[
                      const ProjectCardSkeleton(),
                      const ProjectCardSkeleton(),
                    ] else ...[
                      ..._buildRecommendedProjects(context, isDark, primary, cardBg, borderCol, textMain, textMuted, state),
                    ],
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color, Color textMain, Color textMuted) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 4),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textMain)),
          ],
        ),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: textMuted)),
      ],
    );
  }

  Widget _buildActiveWorkspaceCard(BuildContext context, bool isDark, Color primary, Color cardBg, Color borderCol, Color textMain, Color textMuted, AppState state) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => WorkspaceScreen(
              project: state.projects.isNotEmpty ? state.projects.first : null,
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'IN PROGRESS',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: primary),
                  ),
                ),
                const Spacer(),
                Icon(Icons.shield_rounded, size: 14, color: primary),
                const SizedBox(width: 4),
                Text('HEALTHY (92%)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: primary)),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'AeroRoute AI',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textMain),
            ),
            const SizedBox(height: 4),
            Text(
              'Autonomous aerial logistics platform with dynamic fleet routing.',
              style: TextStyle(fontSize: 13, color: textMuted, height: 1.4),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Icon(Icons.check_circle_outline_rounded, size: 14, color: textMuted),
                const SizedBox(width: 6),
                Text('2 Sprints in review', style: TextStyle(fontSize: 12, color: textMuted)),
                const Spacer(),
                Text('Stanford & MIT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: primary)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildRecommendedProjects(BuildContext context, bool isDark, Color primary, Color cardBg, Color borderCol, Color textMain, Color textMuted, AppState state) {
    final list = (feedData?['recommendedProjects'] as List?) ?? [];
    if (list.isEmpty) {
      return [
        EmptyStateWidget(
          icon: Icons.search_off_rounded,
          title: 'No Matches Found',
          message: 'Explore the catalog or adjust your skills to get recommendations.',
          buttonText: 'Discover Projects',
          onButtonPressed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const ExploreScreen()));
          },
        ),
      ];
    }

    return list.map((p) {
      final projectId = p['id']?.toString() ?? '';
      final isBookmarked = state.isBookmarked(projectId);

      return Container(
        margin: const EdgeInsets.only(bottom: 16),
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
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.brandAccent.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    p['domain'] ?? 'Technology',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.brandAccent),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.auto_awesome_rounded, size: 12, color: primary),
                      const SizedBox(width: 4),
                      Text('${p['matchPercentage'] ?? 90}% Match', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: primary)),
                    ],
                  ),
                ),
                IconButton(
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  icon: Icon(
                    isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                    size: 20,
                    color: isBookmarked ? primary : textMuted,
                  ),
                  onPressed: () => state.toggleBookmark(projectId),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              p['title'] ?? '',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textMain),
            ),
            const SizedBox(height: 6),
            Text(
              p['publicTeaser'] ?? '',
              style: TextStyle(fontSize: 13, color: textMuted, height: 1.4),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: ((p['requiredSkills'] as List?) ?? []).take(3).map((s) {
                return SkillPill(
                  skillName: s['skillName'] ?? '',
                  isCritical: s['isCritical'] == true,
                );
              }).toList(),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Text(
                  '${p['currentMemberCount'] ?? 1}/${p['teamSize'] ?? 4} Builders',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textMuted),
                ),
                const Spacer(),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(110, 36),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  ),
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const ExploreScreen()));
                  },
                  child: const Text('View Role', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ],
        ),
      );
    }).toList();
  }
}
