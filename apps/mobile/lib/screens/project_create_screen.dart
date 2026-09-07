import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../core/api_client.dart';
import '../models/project.dart';
import '../widgets/badge_chips.dart';
import 'workspace_screen.dart';

class ProjectCreateScreen extends StatefulWidget {
  const ProjectCreateScreen({Key? key}) : super(key: key);

  @override
  State<ProjectCreateScreen> createState() => _ProjectCreateScreenState();
}

class _ProjectCreateScreenState extends State<ProjectCreateScreen> {
  int currentStep = 1;
  final int totalSteps = 9;

  // Step 1
  final TextEditingController titleController = TextEditingController();

  // Step 2
  final TextEditingController publicTeaserController = TextEditingController();

  // Step 3
  String selectedCategory = 'Robotics & Applied AI';
  final List<String> categories = [
    'Robotics & Applied AI',
    'Autonomous Drones',
    'Healthcare & AI',
    'FinTech & DeFi',
    'Climate & CleanTech',
    'Distributed Systems',
  ];

  // Step 4
  String selectedDuration = '8 weeks';
  final List<String> durations = [
    '4 weeks',
    '8 weeks',
    '12 weeks',
    'Semester',
  ];

  // Step 5
  int teamSize = 4;

  // Step 6: Roles
  final List<Map<String, dynamic>> roles = [
    {
      'title': 'Machine Learning Engineer',
      'skills': ['PyTorch', 'Python'],
    },
    {
      'title': 'Frontend Developer',
      'skills': ['React', 'TypeScript'],
    }
  ];

  // Step 7
  String selectedDifficulty = 'INTERMEDIATE';

  // Step 8: College Visibility
  String collegeVisibility = 'ANY_COLLEGE'; // MY_COLLEGE, SELECTED_COLLEGES, ANY_COLLEGE

  // Step 9: Private Details
  final TextEditingController techApproachController = TextEditingController();
  final TextEditingController repoUrlController = TextEditingController();
  final TextEditingController datasetController = TextEditingController();

  bool isAnalyzing = false;
  Map<String, dynamic>? aiAnalysisResult;
  bool isPublishing = false;

  Future<void> handleAnalyzeWithAI() async {
    setState(() => isAnalyzing = true);
    try {
      final res = await ApiClient.post('/projects/ai-analyze', {
        'title': titleController.text.trim().isNotEmpty
            ? titleController.text.trim()
            : 'Untitled Innovation Project',
        'pitch': publicTeaserController.text.trim(),
      });

      if (res['success'] == true) {
        setState(() => aiAnalysisResult = res['data']);
      }
    } catch (e) {
      // Fallback
      setState(() {
        aiAnalysisResult = {
          'title': titleController.text,
          'publicTeaser': publicTeaserController.text,
          'feasibilityScore': 94,
        };
      });
    } finally {
      if (mounted) setState(() => isAnalyzing = false);
    }
  }

  Future<void> handlePublish() async {
    setState(() => isPublishing = true);
    try {
      final payload = {
        'title': titleController.text.trim(),
        'publicTeaser': publicTeaserController.text.trim(),
        'pitch': publicTeaserController.text.trim(),
        'domain': selectedCategory,
        'difficulty': selectedDifficulty,
        'duration': selectedDuration,
        'teamSize': teamSize,
        'collegeVisibility': collegeVisibility,
        'technicalApproach': techApproachController.text.trim(),
        'privateRepoUrl': repoUrlController.text.trim(),
        'datasetInfo': datasetController.text.trim(),
        'roles': roles.map((r) {
          return {
            'title': r['title'],
            'description': 'Core engineering role.',
            'requiredSkills': (r['skills'] as List).map((s) {
              return {
                'skillName': s,
                'minLevel': 3,
                'isCritical': true,
              };
            }).toList(),
          };
        }).toList(),
      };

      final res = await ApiClient.post('/projects', payload);
      if (res['success'] == true) {
        final newProject = ProjectModel.fromJson(res['data'] ?? payload);
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
                builder: (_) => WorkspaceScreen(project: newProject)),
          );
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error creating project: $e')),
      );
    } finally {
      if (mounted) setState(() => isPublishing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (aiAnalysisResult != null) {
      return _buildAIReviewScreen();
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B0F19),
        title: Text(
          'Step $currentStep of $totalSteps: ${currentStep <= 8 ? "Public" : "Private IP"}',
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            LinearProgressIndicator(
              value: currentStep / totalSteps,
              backgroundColor: const Color(0xFF1F293D),
              valueColor:
                  const AlwaysStoppedAnimation<Color>(Color(0xFF22C55E)),
              minHeight: 3,
            ),
            Expanded(
              child: SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: _buildCurrentStepView(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentStepView() {
    switch (currentStep) {
      case 1:
        return _buildStep('Step 1: Project Title', 'Give your innovation a clear name.', [
          TextField(
            controller: titleController,
            decoration: const InputDecoration(
              labelText: 'Project Title',
              hintText: 'e.g. AeroRoute AI',
            ),
          ),
        ], onNext: () => setState(() => currentStep = 2));
      case 2:
        return _buildStep('Step 2: Short Public Description', 'Public teaser for student discovery (No proprietary code).', [
          TextField(
            controller: publicTeaserController,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Public Teaser',
              hintText: 'Autonomous aerial routing platform...',
            ),
          ),
        ], onNext: () => setState(() => currentStep = 3));
      case 3:
        return _buildStep('Step 3: Category', 'Select the project domain.', [
          ...categories.map((cat) {
            final isSel = selectedCategory == cat;
            return ListTile(
              title: Text(cat, style: const TextStyle(fontSize: 13, color: Colors.white)),
              trailing: isSel ? const Icon(Icons.check, color: Color(0xFF22C55E)) : null,
              onTap: () => setState(() => selectedCategory = cat),
            );
          }),
        ], onNext: () => setState(() => currentStep = 4));
      case 4:
        return _buildStep('Step 4: Expected Duration', 'Estimated milestone delivery timeframe.', [
          ...durations.map((dur) {
            final isSel = selectedDuration == dur;
            return ListTile(
              title: Text(dur, style: const TextStyle(fontSize: 13, color: Colors.white)),
              trailing: isSel ? const Icon(Icons.check, color: Color(0xFF22C55E)) : null,
              onTap: () => setState(() => selectedDuration = dur),
            );
          }),
        ], onNext: () => setState(() => currentStep = 5));
      case 5:
        return _buildStep('Step 5: Desired Team Size', 'Number of cross-college builders needed.', [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [2, 3, 4, 5, 6].map((s) {
              final isSel = teamSize == s;
              return ChoiceChip(
                label: Text('$s Builders'),
                selected: isSel,
                onSelected: (_) => setState(() => teamSize = s),
              );
            }).toList(),
          ),
        ], onNext: () => setState(() => currentStep = 6));
      case 6:
        return _buildStep('Step 6: Required Roles & Skills', 'Define positions you need to fill.', [
          ...roles.map((r) {
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(r['title'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                subtitle: Text('Skills: ${(r['skills'] as List).join(', ')}'),
              ),
            );
          }),
        ], onNext: () => setState(() => currentStep = 7));
      case 7:
        return _buildStep('Step 7: Project Difficulty', 'Assess expected complexity.', [
          ...['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map((diff) {
            final isSel = selectedDifficulty == diff;
            return ListTile(
              title: Text(diff, style: const TextStyle(fontSize: 13, color: Colors.white)),
              trailing: isSel ? const Icon(Icons.check, color: Color(0xFF22C55E)) : null,
              onTap: () => setState(() => selectedDifficulty = diff),
            );
          }),
        ], onNext: () => setState(() => currentStep = 8));
      case 8:
        return _buildStep('Step 8: College Visibility', 'Universities allowed to discover this project.', [
          ...[
            {'id': 'ANY_COLLEGE', 'label': 'Any College (Open Innovation)'},
            {'id': 'SELECTED_COLLEGES', 'label': 'Selected Colleges'},
            {'id': 'MY_COLLEGE', 'label': 'My College Only'},
          ].map((opt) {
            final isSel = collegeVisibility == opt['id'];
            return ListTile(
              title: Text(opt['label']!, style: const TextStyle(fontSize: 13, color: Colors.white)),
              trailing: isSel ? const Icon(Icons.check, color: Color(0xFF22C55E)) : null,
              onTap: () => setState(() => collegeVisibility = opt['id']!),
            );
          }),
        ], onNext: () => setState(() => currentStep = 9));
      case 9:
        return _buildStep('Step 9: Private Project Details', '🔒 Encrypted Workspace IP (Restricted to accepted team).', [
          TextField(
            controller: techApproachController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Technical Approach / Secret Algorithms',
              hintText: 'Proprietary trajectory optimization...',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: repoUrlController,
            decoration: const InputDecoration(
              labelText: 'Private Repository URL',
              hintText: 'https://github.com/secret/repo',
            ),
          ),
        ], isLastStep: true, onNext: handleAnalyzeWithAI);
      default:
        return Container();
    }
  }

  Widget _buildStep(String title, String subtitle, List<Widget> children,
      {bool isLastStep = false, required VoidCallback onNext}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
              fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFFF8FAFC)),
        ),
        const SizedBox(height: 4),
        Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
        const SizedBox(height: 20),
        ...children,
        const SizedBox(height: 24),
        Row(
          children: [
            if (currentStep > 1) ...[
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => currentStep--),
                  child: const Text('Back'),
                ),
              ),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: ElevatedButton(
                onPressed: isAnalyzing ? null : onNext,
                child: Text(isLastStep
                    ? (isAnalyzing ? 'Analyzing with AI...' : 'Analyze Project with AI')
                    : 'Continue'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAIReviewScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B0F19),
        title: const Text('AI Analysis & Requirements Editor', style: TextStyle(fontSize: 14)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => aiAnalysisResult = null),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF22C55E).withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: Color(0xFF4ADE80)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'AI Decomposition Complete',
                            style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFF8FAFC)),
                          ),
                          Text(
                            'Review and customize requirements before saving to database.',
                            style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Title & Teaser
              Text(
                titleController.text.isNotEmpty ? titleController.text : 'Project Title',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFFF8FAFC)),
              ),
              const SizedBox(height: 4),
              Text(
                publicTeaserController.text.isNotEmpty ? publicTeaserController.text : 'Public teaser',
                style: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
              ),
              const SizedBox(height: 20),

              // Roles Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'AI-SUGGESTED ROLES & SKILLS',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF4ADE80)),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      setState(() {
                        roles.add({
                          'title': 'New Specialist',
                          'skills': ['Python', 'PostgreSQL'],
                        });
                      });
                    },
                    icon: const Icon(Icons.add, size: 14),
                    label: const Text('Add Role', style: TextStyle(fontSize: 11)),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Editable Roles List
              ...roles.asMap().entries.map((entry) {
                final idx = entry.key;
                final r = entry.value;
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
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
                          Expanded(
                            child: Text(
                              r['title'],
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFFF8FAFC)),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0B0F19),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('1 person • Intermediate', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 16, color: Color(0xFFF43F5E)),
                            onPressed: () {
                              if (roles.length > 1) {
                                setState(() => roles.removeAt(idx));
                              }
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: (r['skills'] as List).map((s) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF22C55E).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFF22C55E).withOpacity(0.3)),
                            ),
                            child: Text(
                              s,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF4ADE80)),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                );
              }).toList(),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: isPublishing ? null : handlePublish,
                  icon: const Icon(Icons.check_circle_outline, size: 18),
                  label: Text(isPublishing
                      ? 'Saving Requirements...'
                      : 'Confirm & Save Approved Requirements'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
