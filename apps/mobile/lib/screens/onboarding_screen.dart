import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import '../providers/app_state.dart';
import '../main.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({Key? key}) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int currentStep = 1;
  final int totalSteps = 4;

  // Step 1
  final TextEditingController nameController = TextEditingController();
  final TextEditingController courseController = TextEditingController();
  int graduationYear = 2027;
  String selectedAvatar =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80';

  final List<String> presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&auto=format&fit=crop&q=80',
  ];

  // Step 2: Skills
  final TextEditingController skillSearchController = TextEditingController();
  final List<String> availableSkills = [
    'React',
    'TypeScript',
    'PyTorch',
    'Python',
    'Graph Neural Networks',
    'ROS2',
    'C++',
    'Go',
    'Flutter',
    'Docker',
    'PostgreSQL',
    'Figma',
  ];

  final Map<String, int> selectedSkills = {
    'React': 4,
    'TypeScript': 4,
    'Python': 3,
  };

  // Step 3: Interests & Availability
  final List<String> domainInterests = [
    'Robotics & Applied AI',
    'Autonomous Drones',
    'Healthcare AI',
    'FinTech & DeFi',
    'Distributed Systems',
    'CleanTech',
  ];
  final Set<String> selectedInterests = {'Robotics & Applied AI'};
  String weeklyAvailability = '5-10h';

  // Step 4: Links
  final TextEditingController githubController = TextEditingController();
  final TextEditingController portfolioController = TextEditingController();

  bool isSubmitting = false;
  bool isCompleted = false;
  int completionScore = 90;

  @override
  void initState() {
    super.initState();
    final state = Provider.of<AppState>(context, listen: false);
    if (state.currentUser != null) {
      nameController.text = state.currentUser!.name;
    }
  }

  Future<void> handleComplete() async {
    setState(() => isSubmitting = true);

    try {
      final skillList = selectedSkills.entries
          .map((e) => {
                'skillName': e.key,
                'proficiency': e.value,
                'category': 'General',
              })
          .toList();

      final res = await ApiClient.post('/users/onboarding', {
        'name': nameController.text.trim().isNotEmpty
            ? nameController.text.trim()
            : 'Builder',
        'avatarUrl': selectedAvatar,
        'course': courseController.text.trim().isNotEmpty
            ? courseController.text.trim()
            : 'Computer Science',
        'graduationYear': graduationYear,
        'skills': skillList,
        'interests': selectedInterests.toList(),
        'weeklyAvailability': weeklyAvailability,
        'githubUrl': githubController.text.trim().isNotEmpty
            ? githubController.text.trim()
            : null,
        'portfolioUrl': portfolioController.text.trim().isNotEmpty
            ? portfolioController.text.trim()
            : null,
      });

      if (res['success'] == true) {
        setState(() {
          completionScore = res['data']['completion']['percentage'] ?? 90;
          isCompleted = true;
        });
      }
    } catch (e) {
      setState(() {
        completionScore = 90;
        isCompleted = true;
      });
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isCompleted) {
      return _buildCelebrationScreen();
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Step $currentStep of $totalSteps',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
        ),
        actions: [
          if (currentStep > 1)
            TextButton(
              onPressed: handleComplete,
              child: const Text(
                'Skip',
                style: TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress Line
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
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: currentStep == 1
                    ? _buildStep1()
                    : currentStep == 2
                        ? _buildStep2()
                        : currentStep == 3
                            ? _buildStep3()
                            : _buildStep4(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Profile & Campus',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: Color(0xFFF8FAFC),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Set up your student builder identity.',
          style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 20),

        const Text(
          'SELECT AVATAR',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Color(0xFF4ADE80),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: presetAvatars.map((url) {
            final isSelected = selectedAvatar == url;
            return GestureDetector(
              onTap: () => setState(() => selectedAvatar = url),
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF22C55E)
                        : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: CircleAvatar(
                  radius: 26,
                  backgroundImage: NetworkImage(url),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),

        TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: 'Full Name',
            hintText: 'Elena Patel',
            prefixIcon: Icon(Icons.person_outline, size: 18),
          ),
        ),
        const SizedBox(height: 12),

        TextField(
          controller: courseController,
          decoration: const InputDecoration(
            labelText: 'Degree / Course',
            hintText: 'B.S. Artificial Intelligence',
            prefixIcon: Icon(Icons.book_outlined, size: 18),
          ),
        ),
        const SizedBox(height: 12),

        DropdownButtonFormField<int>(
          value: graduationYear,
          decoration: const InputDecoration(
            labelText: 'Graduation Year',
            prefixIcon: Icon(Icons.calendar_today_outlined, size: 18),
          ),
          dropdownColor: const Color(0xFF111827),
          items: [2025, 2026, 2027, 2028, 2029].map((year) {
            return DropdownMenuItem(
              value: year,
              child: Text('Class of $year'),
            );
          }).toList(),
          onChanged: (val) {
            if (val != null) setState(() => graduationYear = val);
          },
        ),
        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => setState(() => currentStep = 2),
            child: const Text('Continue to Skills'),
          ),
        ),
      ],
    );
  }

  Widget _buildStep2() {
    final query = skillSearchController.text.toLowerCase();
    final filtered = availableSkills
        .where((s) => s.toLowerCase().contains(query) && !selectedSkills.containsKey(s))
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Technical Skills',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: Color(0xFFF8FAFC),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Search chips and rate your proficiency level (1-5).',
          style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 16),

        TextField(
          controller: skillSearchController,
          onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(
            labelText: 'Search Skills',
            hintText: 'e.g. PyTorch, React, ROS2...',
            prefixIcon: Icon(Icons.search, size: 18),
          ),
        ),
        const SizedBox(height: 12),

        if (filtered.isNotEmpty) ...[
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: filtered.take(6).map((s) {
              return ActionChip(
                label: Text('+ $s'),
                backgroundColor: const Color(0xFF111827),
                side: const BorderSide(color: Color(0xFF1F293D)),
                labelStyle: const TextStyle(
                  color: Color(0xFF4ADE80),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
                onPressed: () {
                  setState(() {
                    selectedSkills[s] = 3;
                    skillSearchController.clear();
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
        ],

        const Text(
          'SELECTED SKILLS & PROFICIENCY',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Color(0xFF4ADE80),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 8),

        ...selectedSkills.entries.map((entry) {
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF1F293D)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  entry.key,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFF8FAFC),
                  ),
                ),
                Row(
                  children: [
                    ...List.generate(5, (i) {
                      final lvl = i + 1;
                      final isActive = entry.value >= lvl;
                      return GestureDetector(
                        onTap: () {
                          setState(() => selectedSkills[entry.key] = lvl);
                        },
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 2),
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isActive
                                ? const Color(0xFF22C55E)
                                : const Color(0xFF0B0F19),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '$lvl',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: isActive
                                  ? const Color(0xFF0B0F19)
                                  : const Color(0xFF94A3B8),
                            ),
                          ),
                        ),
                      );
                    }),
                    IconButton(
                      icon: const Icon(Icons.close, size: 14),
                      onPressed: () {
                        setState(() => selectedSkills.remove(entry.key));
                      },
                    ),
                  ],
                ),
              ],
            ),
          );
        }).toList(),

        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => currentStep = 1),
                child: const Text('Back'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ElevatedButton(
                onPressed: () => setState(() => currentStep = 3),
                child: const Text('Continue'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Interests & Availability',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: Color(0xFFF8FAFC),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Tell us what projects inspire you and your weekly time.',
          style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 16),

        const Text(
          'PROJECT DOMAIN INTERESTS',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Color(0xFF4ADE80),
          ),
        ),
        const SizedBox(height: 8),

        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: domainInterests.map((d) {
            final isSel = selectedInterests.contains(d);
            return FilterChip(
              label: Text(d),
              selected: isSel,
              selectedColor: const Color(0xFF22C55E).withOpacity(0.2),
              backgroundColor: const Color(0xFF111827),
              side: BorderSide(
                color: isSel
                    ? const Color(0xFF22C55E)
                    : const Color(0xFF1F293D),
              ),
              labelStyle: TextStyle(
                color: isSel ? const Color(0xFF4ADE80) : const Color(0xFF94A3B8),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              onSelected: (val) {
                setState(() {
                  if (val) {
                    selectedInterests.add(d);
                  } else {
                    selectedInterests.remove(d);
                  }
                });
              },
            );
          }).toList(),
        ),

        const SizedBox(height: 24),

        const Text(
          'WEEKLY COMMITMENT',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Color(0xFF4ADE80),
          ),
        ),
        const SizedBox(height: 8),

        ...[
          {'val': '0-5h', 'label': '0–5 hours/week (Light advisor)'},
          {'val': '5-10h', 'label': '5–10 hours/week (Standard builder)'},
          {'val': '10-20h', 'label': '10–20 hours/week (Core engineer)'},
          {'val': '20+h', 'label': '20+ hours/week (Hackathon mode)'},
        ].map((opt) {
          final isSel = weeklyAvailability == opt['val'];
          return GestureDetector(
            onTap: () => setState(() => weeklyAvailability = opt['val']!),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSel
                    ? const Color(0xFF22C55E).withOpacity(0.1)
                    : const Color(0xFF111827),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSel
                      ? const Color(0xFF22C55E)
                      : const Color(0xFF1F293D),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isSel ? Icons.check_circle : Icons.radio_button_unchecked,
                    size: 16,
                    color: isSel
                        ? const Color(0xFF22C55E)
                        : const Color(0xFF94A3B8),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    opt['label']!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isSel
                          ? const Color(0xFFF8FAFC)
                          : const Color(0xFFCBD5E1),
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),

        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => currentStep = 2),
                child: const Text('Back'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ElevatedButton(
                onPressed: () => setState(() => currentStep = 4),
                child: const Text('Continue to Links'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStep4() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Proof of Work',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: Color(0xFFF8FAFC),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Link your developer profile to verify skill evidence.',
          style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 20),

        TextField(
          controller: githubController,
          decoration: const InputDecoration(
            labelText: 'GitHub Profile URL',
            hintText: 'https://github.com/username',
            prefixIcon: Icon(Icons.code, size: 18),
          ),
        ),
        const SizedBox(height: 12),

        TextField(
          controller: portfolioController,
          decoration: const InputDecoration(
            labelText: 'Portfolio / Website',
            hintText: 'https://yourportfolio.dev',
            prefixIcon: Icon(Icons.language, size: 18),
          ),
        ),
        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: isSubmitting ? null : handleComplete,
            child: Text(isSubmitting
                ? 'Finalizing Profile...'
                : 'Complete Onboarding & Activate Profile'),
          ),
        ),
      ],
    );
  }

  Widget _buildCelebrationScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),

              // Circular Gauge
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF22C55E).withOpacity(0.12),
                  border: Border.all(
                    color: const Color(0xFF22C55E),
                    width: 3,
                  ),
                ),
                child: Center(
                  child: Text(
                    '$completionScore%',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF4ADE80),
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              const Text(
                'Your profile is ready.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFF8FAFC),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Your verified skills and campus credentials are ready for cross-college matching.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
              ),

              const Spacer(),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const MainNavigationShell()),
                      (route) => false,
                    );
                  },
                  child: const Text('Start Exploring Projects'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
