import 'package:flutter/material.dart';
import 'search_number_screen.dart';
import 'search_name_screen.dart';
import 'names_list_screen.dart';
import 'contact_us_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final List<Widget> _screens = [
    const SearchNumberScreen(),
    const SearchNameScreen(),
    const NamesListScreen(),
    const ContactUsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ارقام اليمن', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22)),
        centerTitle: true,
        backgroundColor: const Color(0xFF2196F3),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (i) => setState(() => _selectedIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF2196F3),
        unselectedItemColor: Colors.grey.shade400,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontSize: 10),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.phone_android_rounded), label: 'بالرقم'),
          BottomNavigationBarItem(icon: Icon(Icons.person_search_rounded), label: 'بالإسم'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'الأسماء'),
          BottomNavigationBarItem(icon: Icon(Icons.support_agent_rounded), label: 'تواصل'),
        ],
      ),
    );
  }
}