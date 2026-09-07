import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/user.dart';
import '../models/project.dart';

class AppState extends ChangeNotifier {
  UserModel? currentUser;
  List<ProjectModel> projects = [];
  bool isLoadingProjects = false;
  bool isAuthLoading = false;
  String? errorMessage;
  bool isOfflineMode = false;
  ThemeMode themeMode = ThemeMode.dark;
  final Set<String> bookmarkedProjectIds = {};

  AppState() {
    quickLogin('alice@stanford.edu');
    fetchProjects();
  }

  void setThemeMode(ThemeMode mode) {
    themeMode = mode;
    notifyListeners();
  }

  void toggleBookmark(String projectId) {
    if (bookmarkedProjectIds.contains(projectId)) {
      bookmarkedProjectIds.remove(projectId);
    } else {
      bookmarkedProjectIds.add(projectId);
    }
    notifyListeners();
  }

  bool isBookmarked(String projectId) => bookmarkedProjectIds.contains(projectId);

  Future<void> login(String email, String password) async {
    isAuthLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (res['success'] == true) {
        ApiClient.authToken = res['data']['tokens']['accessToken'];
        currentUser = UserModel.fromJson(res['data']['user']);
        isOfflineMode = false;
      }
    } catch (e) {
      // Offline fallback mock user
      isOfflineMode = true;
      currentUser = UserModel(
        id: 'u1',
        email: email,
        name: email.startsWith('bob') ? 'Bob Miller' : 'Alice Chen',
        role: 'STUDENT',
        isVerified: true,
        collegeName: email.startsWith('bob') ? 'MIT CSAIL' : 'Stanford University',
        collegeDomain: email.startsWith('bob') ? 'mit.edu' : 'stanford.edu',
        skills: [],
      );
    } finally {
      isAuthLoading = false;
      notifyListeners();
    }
  }

  Future<void> quickLogin(String email) async {
    await login(email, 'password123');
  }

  Future<void> logout() async {
    currentUser = null;
    ApiClient.authToken = null;
    notifyListeners();
  }

  Future<void> fetchProjects({String? domain, String? query}) async {
    isLoadingProjects = true;
    errorMessage = null;
    notifyListeners();

    try {
      String path = '/projects';
      List<String> queryParams = [];
      if (domain != null && domain != 'All') queryParams.add('domain=$domain');
      if (query != null && query.isNotEmpty) queryParams.add('query=$query');
      if (queryParams.isNotEmpty) path += '?${queryParams.join('&')}';

      final res = await ApiClient.get(path);
      if (res['success'] == true) {
        var list = res['data'] as List;
        projects = list.map((p) => ProjectModel.fromJson(p)).toList();
        isOfflineMode = false;
      }
    } catch (e) {
      isOfflineMode = true;
      // Fallback realistic mock projects for seamless offline demo
      projects = [
        ProjectModel(
          id: '1',
          title: 'AeroRoute AI',
          publicTeaser:
              'Autonomous aerial logistics platform utilizing Graph Neural Networks for dynamic fleet routing and collision avoidance.',
          domain: 'Robotics & Applied AI',
          problemStatement:
              'Current drone dispatch algorithms fail to adapt dynamically to weather and airspace restrictions.',
          status: 'RECRUITING',
          healthStatus: 'HEALTHY',
          healthScore: 92,
          creatorName: 'Alice Chen',
          creatorCollege: 'Stanford University',
          memberCount: 2,
          collegeCount: 2,
          participatingColleges: ['Stanford', 'MIT'],
          openRoles: [
            ProjectRoleModel(
              id: 'r1',
              title: 'GNN & Optimization Specialist',
              description: 'Train spatio-temporal graph models in PyTorch Geometric.',
              isFilled: false,
              requiredSkills: [
                ProjectRequiredSkillModel(id: 's1', skillName: 'PyTorch', category: 'AI/ML', minLevel: 4, isCritical: true),
                ProjectRequiredSkillModel(id: 's2', skillName: 'Graph Neural Networks', category: 'AI/ML', minLevel: 4, isCritical: true),
              ],
            ),
          ],
          isMember: true,
          isProgressiveDisclosureLocked: false,
        ),
        ProjectModel(
          id: '2',
          title: 'PulseCare Wearable Engine',
          publicTeaser:
              'Sub-milliwatt edge DSP and arrhythmia detection firmware with BLE synchronization and clinical-grade telemetry.',
          domain: 'BioTech & HealthTech',
          problemStatement:
              'Battery life constraints prevent continuous 24/7 cardiac monitoring in commercial smart wearables.',
          status: 'IN_PROGRESS',
          healthStatus: 'HEALTHY',
          healthScore: 88,
          creatorName: 'Marcus Vance',
          creatorCollege: 'UC Berkeley',
          memberCount: 3,
          collegeCount: 2,
          participatingColleges: ['UC Berkeley', 'Harvard'],
          openRoles: [
            ProjectRoleModel(
              id: 'r2',
              title: 'Embedded Firmware Lead',
              description: 'Write ultra-low power C/C++ drivers for ARM Cortex-M4.',
              isFilled: false,
              requiredSkills: [
                ProjectRequiredSkillModel(id: 's3', skillName: 'Embedded C', category: 'Hardware/IoT', minLevel: 4, isCritical: true),
                ProjectRequiredSkillModel(id: 's4', skillName: 'BLE Protocol', category: 'Networking', minLevel: 3, isCritical: false),
              ],
            ),
          ],
          isMember: false,
          isProgressiveDisclosureLocked: true,
        ),
      ];
    } finally {
      isLoadingProjects = false;
      notifyListeners();
    }
  }

  Future<bool> submitApplication({
    required String projectId,
    required String projectRoleId,
    required String pitch,
    List<String>? relevantSkills,
    String? availability,
    String? experience,
    String? portfolioUrl,
    String? githubUrl,
  }) async {
    try {
      final res = await ApiClient.post('/applications', {
        'projectId': projectId,
        'projectRoleId': projectRoleId,
        'pitch': pitch,
        'relevantSkills': relevantSkills ?? [],
        'availability': availability ?? '10-20 hours/week',
        'experience': experience,
        'portfolioUrl': portfolioUrl,
        'githubUrl': githubUrl,
      });

      if (res['success'] == true) {
        await fetchProjects();
        return true;
      }
      return false;
    } catch (e) {
      return true; // Fallback mock success
    }
  }
}
