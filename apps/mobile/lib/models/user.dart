class UserSkillModel {
  final String id;
  final String skillName;
  final String category;
  final int proficiency;
  final String? evidenceUrl;
  final String? evidenceSummary;
  final bool isVerified;

  UserSkillModel({
    required this.id,
    required this.skillName,
    required this.category,
    required this.proficiency,
    this.evidenceUrl,
    this.evidenceSummary,
    required this.isVerified,
  });

  factory UserSkillModel.fromJson(Map<String, dynamic> json) {
    return UserSkillModel(
      id: json['id'] ?? '',
      skillName: json['skillName'] ?? '',
      category: json['category'] ?? 'General',
      proficiency: json['proficiency'] ?? 3,
      evidenceUrl: json['evidenceUrl'],
      evidenceSummary: json['evidenceSummary'],
      isVerified: json['isVerified'] ?? false,
    );
  }
}

class UserModel {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? avatarUrl;
  final String? bio;
  final String? major;
  final int? graduationYear;
  final String? githubUrl;
  final String? portfolioUrl;
  final String? linkedinUrl;
  final bool isVerified;
  final String collegeName;
  final String collegeDomain;
  final List<UserSkillModel> skills;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.avatarUrl,
    this.bio,
    this.major,
    this.graduationYear,
    this.githubUrl,
    this.portfolioUrl,
    this.linkedinUrl,
    required this.isVerified,
    required this.collegeName,
    required this.collegeDomain,
    required this.skills,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    var rawSkills = json['skills'] as List? ?? [];
    List<UserSkillModel> parsedSkills =
        rawSkills.map((s) => UserSkillModel.fromJson(s)).toList();

    var col = json['college'] ?? {};
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? 'STUDENT',
      avatarUrl: json['avatarUrl'],
      bio: json['bio'],
      major: json['major'],
      graduationYear: json['graduationYear'],
      githubUrl: json['githubUrl'],
      portfolioUrl: json['portfolioUrl'],
      linkedinUrl: json['linkedinUrl'],
      isVerified: json['isVerified'] ?? false,
      collegeName: col['name'] ?? 'University',
      collegeDomain: col['domain'] ?? 'edu',
      skills: parsedSkills,
    );
  }
}
