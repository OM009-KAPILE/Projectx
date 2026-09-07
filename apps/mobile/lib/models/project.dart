class ProjectRequiredSkillModel {
  final String id;
  final String skillName;
  final String category;
  final int minLevel;
  final bool isCritical;

  ProjectRequiredSkillModel({
    required this.id,
    required this.skillName,
    required this.category,
    required this.minLevel,
    required this.isCritical,
  });

  factory ProjectRequiredSkillModel.fromJson(Map<String, dynamic> json) {
    return ProjectRequiredSkillModel(
      id: json['id'] ?? '',
      skillName: json['skillName'] ?? '',
      category: json['category'] ?? 'General',
      minLevel: json['minLevel'] ?? 3,
      isCritical: json['isCritical'] ?? true,
    );
  }
}

class ProjectRoleModel {
  final String id;
  final String title;
  final String description;
  final bool isFilled;
  final List<ProjectRequiredSkillModel> requiredSkills;

  ProjectRoleModel({
    required this.id,
    required this.title,
    required this.description,
    required this.isFilled,
    required this.requiredSkills,
  });

  factory ProjectRoleModel.fromJson(Map<String, dynamic> json) {
    var rawSkills = json['requiredSkills'] as List? ?? [];
    return ProjectRoleModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      isFilled: json['isFilled'] ?? false,
      requiredSkills: rawSkills
          .map((s) => ProjectRequiredSkillModel.fromJson(s))
          .toList(),
    );
  }
}

class ProjectModel {
  final String id;
  final String title;
  final String publicTeaser;
  final String domain;
  final String problemStatement;
  final String status;
  final String healthStatus;
  final int healthScore;
  final String creatorName;
  final String creatorCollege;
  final int memberCount;
  final int collegeCount;
  final List<String> participatingColleges;
  final List<ProjectRoleModel> openRoles;
  final bool isMember;
  final bool isProgressiveDisclosureLocked;
  final String? privateRepoUrl;
  final String? architectureSpec;

  ProjectModel({
    required this.id,
    required this.title,
    required this.publicTeaser,
    required this.domain,
    required this.problemStatement,
    required this.status,
    required this.healthStatus,
    required this.healthScore,
    required this.creatorName,
    required this.creatorCollege,
    required this.memberCount,
    required this.collegeCount,
    required this.participatingColleges,
    required this.openRoles,
    required this.isMember,
    required this.isProgressiveDisclosureLocked,
    this.privateRepoUrl,
    this.architectureSpec,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    var rawRoles = json['openRoles'] as List? ?? [];
    var rawColleges = json['participatingColleges'] as List? ?? [];
    var cr = json['creator'] ?? {};

    return ProjectModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      publicTeaser: json['publicTeaser'] ?? '',
      domain: json['domain'] ?? '',
      problemStatement: json['problemStatement'] ?? '',
      status: json['status'] ?? 'RECRUITING',
      healthStatus: json['healthStatus'] ?? 'HEALTHY',
      healthScore: json['healthScore'] ?? 85,
      creatorName: cr['name'] ?? 'Creator',
      creatorCollege: cr['college'] ?? 'University',
      memberCount: json['memberCount'] ?? 1,
      collegeCount: json['collegeCount'] ?? 1,
      participatingColleges: rawColleges.map((c) => c.toString()).toList(),
      openRoles: rawRoles.map((r) => ProjectRoleModel.fromJson(r)).toList(),
      isMember: json['isMember'] ?? false,
      isProgressiveDisclosureLocked: json['isProgressiveDisclosureLocked'] ?? true,
      privateRepoUrl: json['privateRepoUrl'],
      architectureSpec: json['architectureSpec'],
    );
  }
}
