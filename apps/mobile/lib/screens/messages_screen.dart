import 'package:flutter/material.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({Key? key}) : super(key: key);

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final List<Map<String, dynamic>> mockConversations = [
    {
      'id': 'conv-1',
      'title': 'AeroRoute AI Team Chat',
      'isProject': true,
      'projectTitle': 'AeroRoute AI',
      'otherParticipant': 'Team Channel (4 Builders)',
      'college': 'Stanford & MIT',
      'lastMessage': 'Alice: Pushed initial MAVLink waypoint bridge to review branch.',
      'time': '10:45 AM',
      'unreadCount': 2,
    },
    {
      'id': 'conv-2',
      'title': 'Bob Miller',
      'isProject': false,
      'otherParticipant': 'Bob Miller',
      'college': 'MIT CSAIL',
      'lastMessage': 'I can take the GNN trajectory optimization module this sprint.',
      'time': 'Yesterday',
      'unreadCount': 0,
    },
    {
      'id': 'conv-3',
      'title': 'Rohan Sharma',
      'isProject': false,
      'otherParticipant': 'Rohan Sharma',
      'college': 'IIT Bombay',
      'lastMessage': 'Thanks for accepting my application! Setting up PX4 simulator.',
      'time': 'Aug 28',
      'unreadCount': 0,
    },
  ];

  Map<String, dynamic>? selectedConv;
  final TextEditingController _msgController = TextEditingController();
  final List<Map<String, dynamic>> mockMessages = [
    {
      'sender': 'Bob Miller',
      'college': 'MIT CSAIL',
      'content': 'Hi Alice! Excited to collaborate on AeroRoute AI.',
      'time': '10:30 AM',
      'isMe': false,
    },
    {
      'sender': 'Alice Chen',
      'college': 'Stanford University',
      'content': 'Welcome aboard Bob! Check the Architecture spec in Level 3 workspace.',
      'time': '10:32 AM',
      'isMe': true,
    },
    {
      'sender': 'Bob Miller',
      'college': 'MIT CSAIL',
      'content': 'I can take the GNN trajectory optimization module this sprint.',
      'time': '10:45 AM',
      'isMe': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    if (selectedConv != null) {
      return _buildChatDetailView();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages & Team Chat'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shield_outlined, color: Color(0xFF4ADE80)),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Safe messaging enabled. Private IP details protected.'),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Privacy Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: const Color(0xFF111827),
            child: Row(
              children: const [
                Icon(Icons.lock_outline, size: 14, color: Color(0xFF38BDF8)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Direct communication restricted to authorized team members & applicants.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: ListView.separated(
              itemCount: mockConversations.length,
              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFF1F293D)),
              itemBuilder: (context, index) {
                final c = mockConversations[index];
                final isProject = c['isProject'] == true;

                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  leading: CircleAvatar(
                    backgroundColor: isProject
                        ? const Color(0xFFA855F7).withOpacity(0.2)
                        : const Color(0xFF22C55E).withOpacity(0.2),
                    child: Icon(
                      isProject ? Icons.groups : Icons.person,
                      color: isProject ? const Color(0xFFC084FC) : const Color(0xFF4ADE80),
                      size: 20,
                    ),
                  ),
                  title: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        c['title'],
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFFF8FAFC)),
                      ),
                      Text(
                        c['time'],
                        style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 2),
                      Text(
                        c['college'],
                        style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        c['lastMessage'],
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1)),
                      ),
                    ],
                  ),
                  trailing: c['unreadCount'] > 0
                      ? Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: Color(0xFF22C55E),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '${c['unreadCount']}',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF0B0F19)),
                          ),
                        )
                      : null,
                  onTap: () {
                    setState(() {
                      selectedConv = c;
                    });
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatDetailView() {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => selectedConv = null),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              selectedConv!['title'],
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
            ),
            Text(
              selectedConv!['college'],
              style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (val) {
              if (val == 'report') {
                _showReportDialog();
              } else if (val == 'block') {
                _showBlockDialog();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'report',
                child: Text('Report User / Chat', style: TextStyle(color: Color(0xFFF43F5E))),
              ),
              const PopupMenuItem(
                value: 'block',
                child: Text('Block User', style: TextStyle(color: Color(0xFFF43F5E))),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: mockMessages.length,
              itemBuilder: (context, index) {
                final m = mockMessages[index];
                final isMe = m['isMe'] == true;

                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isMe ? const Color(0xFF22C55E) : const Color(0xFF1E293B),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(14),
                        topRight: const Radius.circular(14),
                        bottomLeft: Radius.circular(isMe ? 14 : 0),
                        bottomRight: Radius.circular(isMe ? 0 : 14),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (!isMe) ...[
                          Text(
                            '${m['sender']} (${m['college']})',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8)),
                          ),
                          const SizedBox(height: 4),
                        ],
                        Text(
                          m['content'],
                          style: TextStyle(
                            fontSize: 13,
                            color: isMe ? const Color(0xFF0B0F19) : const Color(0xFFF8FAFC),
                            fontWeight: isMe ? FontWeight.w600 : FontWeight.w400,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Align(
                          alignment: Alignment.bottomRight,
                          child: Text(
                            m['time'],
                            style: TextStyle(
                              fontSize: 9,
                              color: isMe ? const Color(0xFF0B0F19).withOpacity(0.6) : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Message Input
          Container(
            padding: const EdgeInsets.all(12),
            color: const Color(0xFF111827),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgController,
                      style: const TextStyle(fontSize: 13, color: Color(0xFFF8FAFC)),
                      decoration: InputDecoration(
                        hintText: 'Type a safe message...',
                        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                        filled: true,
                        fillColor: const Color(0xFF1F293D),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(20),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFF22C55E),
                      foregroundColor: const Color(0xFF0B0F19),
                    ),
                    icon: const Icon(Icons.send, size: 18),
                    onPressed: () {
                      if (_msgController.text.trim().isNotEmpty) {
                        setState(() {
                          mockMessages.add({
                            'sender': 'Alice Chen',
                            'college': 'Stanford University',
                            'content': _msgController.text.trim(),
                            'time': 'Just now',
                            'isMe': true,
                          });
                          _msgController.clear();
                        });
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showReportDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Report User or Message', style: TextStyle(fontSize: 16)),
        content: const Text('Our Trust & Safety team will review this report within 24 hours.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF43F5E)),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Report submitted successfully.')),
              );
            },
            child: const Text('Submit Report'),
          ),
        ],
      ),
    );
  }

  void _showBlockDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Block User', style: TextStyle(fontSize: 16)),
        content: const Text('Are you sure you want to block this user from sending direct messages?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF43F5E)),
            onPressed: () {
              Navigator.pop(ctx);
              setState(() => selectedConv = null);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('User blocked successfully.')),
              );
            },
            child: const Text('Block User'),
          ),
        ],
      ),
    );
  }
}
