import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/app_state.dart';
import '../models/project.dart';
import '../widgets/badge_chips.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/empty_state_widget.dart';
import '../widgets/custom_text_field.dart';
import 'workspace_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({Key? key}) : super(key: key);

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  String selectedDomain = 'All';
  final TextEditingController searchController = TextEditingController();

  final List<String> domains = [
    'All',
    'Robotics & Applied AI',
    'BioTech & HealthTech',
    'FinTech & DeFi',
    'Climate & CleanTech',
    'Distributed Systems',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppState>(context, listen: false).fetchProjects();
    });
  }

  void _applyFilters() {
    final state = Provider.of<AppState>(context, listen: false);
    state.fetchProjects(
      domain: selectedDomain == 'All' ? null : selectedDomain,
      query: searchController.text.trim().isEmpty ? null : searchController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = isDark ? AppTheme.brandPrimary : AppTheme.brandPrimaryDark;
    final cardBg = isDark ? AppTheme.cardDark : AppTheme.cardLight;
    final borderCol = isDark ? AppTheme.borderDark : AppTheme.borderLight;
    final textMain = isDark ? AppTheme.textLight : AppTheme.textDark;
    final textMuted = isDark ? AppTheme.textMutedDark : AppTheme.textMutedLight;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: primary,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'PX',
                style: TextStyle(
                  color: Color(0xFF0B0F19),
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Discover Projects',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textMain),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search & Filters Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: borderCol, width: 0.8)),
            ),
            child: Column(
              children: [
                // Search Input
                TextField(
                  controller: searchController,
                  onChanged: (_) => _applyFilters(),
                  style: TextStyle(fontSize: 14, color: textMain),
                  decoration: InputDecoration(
                    hintText: 'Search by keyword, role, or stack...',
                    prefixIcon: const Icon(Icons.search_rounded, size: 20),
                    suffixIcon: searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () {
                              searchController.clear();
                              _applyFilters();
                              setState(() {});
                            },
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 12),

                // Horizontal Domain Filters
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: domains.map((d) {
                      final isSelected = selectedDomain == d;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(d),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => selectedDomain = d);
                              _applyFilters();
                            }
                          },
                          labelStyle: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected
                                ? (isDark ? const Color(0xFF0B0F19) : Colors.white)
                                : textMuted,
                          ),
                          selectedColor: primary,
                          backgroundColor: cardBg,
                          side: BorderSide(
                            color: isSelected ? primary : borderCol,
                            width: 1,
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Project Feed List
          Expanded(
            child: state.isLoadingProjects
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: const [
                      ProjectCardSkeleton(),
                      ProjectCardSkeleton(),
                      ProjectCardSkeleton(),
                    ],
                  )
                : state.projects.isEmpty
                    ? EmptyStateWidget(
                        icon: Icons.search_off_rounded,
                        title: 'No Projects Found',
                        message: 'Try clearing your search query or selecting another domain filter.',
                        buttonText: 'Reset Filters',
                        onButtonPressed: () {
                          searchController.clear();
                          setState(() => selectedDomain = 'All');
                          _applyFilters();
                        },
                      )
                    : RefreshIndicator(
                        onRefresh: () => state.fetchProjects(),
                        color: primary,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: state.projects.length,
                          itemBuilder: (context, idx) {
                            final project = state.projects[idx];
                            return _buildProjectCard(context, project, isDark, primary, cardBg, borderCol, textMain, textMuted, state);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectCard(
    BuildContext context,
    ProjectModel project,
    bool isDark,
    Color primary,
    Color cardBg,
    Color borderCol,
    Color textMain,
    Color textMuted,
    AppState state,
  ) {
    final isBookmarked = state.isBookmarked(project.id);

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
                  project.domain,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.brandAccent),
                ),
              ),
              const Spacer(),
              HealthBadge(status: project.healthStatus, score: project.healthScore),
              const SizedBox(width: 8),
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                icon: Icon(
                  isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                  size: 20,
                  color: isBookmarked ? primary : textMuted,
                ),
                onPressed: () => state.toggleBookmark(project.id),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            project.title,
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: textMain),
          ),
          const SizedBox(height: 6),
          Text(
            project.publicTeaser,
            style: TextStyle(fontSize: 13, color: textMuted, height: 1.4),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),

          // Open Roles Summary
          if (project.openRoles.isNotEmpty) ...[
            Text(
              'OPEN ROLES:',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textMuted, letterSpacing: 0.5),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: project.openRoles.map((role) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.bolt_rounded, size: 14, color: primary),
                      const SizedBox(width: 4),
                      Text(
                        role.title,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: primary),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 14),
          ],

          Row(
            children: [
              Text(
                '${project.memberCount} Builders • ${project.collegeCount} Colleges',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textMuted),
              ),
              const Spacer(),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(120, 38),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                onPressed: () => _showProjectDetailModal(context, project, isDark, primary, textMain, textMuted),
                child: const Text('View Project', style: TextStyle(fontSize: 13)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showProjectDetailModal(
    BuildContext context,
    ProjectModel project,
    bool isDark,
    Color primary,
    Color textMain,
    Color textMuted,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppTheme.bgDark : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.85,
          maxChildSize: 0.95,
          minChildSize: 0.5,
          expand: false,
          builder: (_, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: textMuted.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.brandAccent.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          project.domain,
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.brandAccent),
                        ),
                      ),
                      const Spacer(),
                      HealthBadge(status: project.healthStatus, score: project.healthScore),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    project.title,
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textMain),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Led by ${project.creatorName} (${project.creatorCollege})',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: primary),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Problem & Opportunity',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textMain),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    project.problemStatement.isNotEmpty ? project.problemStatement : project.publicTeaser,
                    style: TextStyle(fontSize: 14, color: textMuted, height: 1.5),
                  ),
                  const SizedBox(height: 24),

                  Text(
                    'Available Open Roles',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textMain),
                  ),
                  const SizedBox(height: 12),
                  ...project.openRoles.map((role) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.cardDark : AppTheme.surfaceLight,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: isDark ? AppTheme.borderDark : AppTheme.borderLight),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                role.title,
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textMain),
                              ),
                              const Spacer(),
                              Text(
                                'Open Role',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: primary),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            role.description,
                            style: TextStyle(fontSize: 13, color: textMuted, height: 1.4),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: role.requiredSkills.map((s) {
                              return SkillPill(skillName: s.skillName, isCritical: s.isCritical);
                            }).toList(),
                          ),
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.pop(ctx);
                                _showApplySheet(context, project, role, isDark, primary, textMain);
                              },
                              child: const Text('Apply for this Role'),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showApplySheet(
    BuildContext context,
    ProjectModel project,
    ProjectRoleModel role,
    bool isDark,
    Color primary,
    Color textMain,
  ) {
    final pitchCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppTheme.bgDark : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Apply to ${project.title}',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textMain),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Role: ${role.title}',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: primary),
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    controller: pitchCtrl,
                    label: 'Why are you a strong fit for this role?',
                    hintText: 'Share relevant coursework, projects, or repositories...',
                    maxLines: 4,
                    validator: (val) {
                      if (val == null || val.trim().length < 10) {
                        return 'Please provide at least a brief 10-character pitch.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (formKey.currentState!.validate()) {
                          Navigator.pop(ctx);
                          final state = Provider.of<AppState>(context, listen: false);
                          final ok = await state.submitApplication(
                            projectId: project.id,
                            projectRoleId: role.id,
                            pitch: pitchCtrl.text.trim(),
                          );
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(ok ? '🎉 Application submitted successfully!' : 'Application saved!'),
                                backgroundColor: primary,
                              ),
                            );
                          }
                        }
                      },
                      child: const Text('Submit Application'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
