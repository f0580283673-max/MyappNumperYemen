import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/contacts_upload_service.dart';
import '../services/firestore_service.dart';
import '../models/contact_model.dart';

class NamesListScreen extends StatefulWidget {
  const NamesListScreen({super.key});
  @override
  State<NamesListScreen> createState() => _NamesListScreenState();
}

class _NamesListScreenState extends State<NamesListScreen> {
  bool _hasAgreed = false;

  @override
  void initState() {
    super.initState();
    _checkStatus();
  }

  void _checkStatus() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => _hasAgreed = prefs.getBool('hasAgreed') ?? false);
  }

  void _showConsentDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        content: const Text(
          "لتمكين هذا الخيار نطلب السماح للتطبيق بالوصول الى\nقائمة جهات الاتصال الخاصة بك، سنشارك رقم الهاتف واسم جهة الاتصال فقط مع المستخدمين الذين يستخدمون هذا التطبيق لتحسين نتائج البحث، كما أننا لن نشارك هذه المعلومات مع أي طرف ثالث.",
          textAlign: TextAlign.right,
          style: TextStyle(fontSize: 14, height: 1.6, fontWeight: FontWeight.bold),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("غير موافق", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold))),
          ElevatedButton(
            onPressed: () async {
              final prefs = await SharedPreferences.getInstance();
              await prefs.setBool('hasAgreed', true);
              await ContactsUploadService.upload();
              setState(() => _hasAgreed = true);
              if (mounted) Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2196F3), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
            child: const Text("موافق I Agree", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasAgreed) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.contact_phone_rounded, size: 100, color: Colors.blue.shade100),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: _showConsentDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2196F3),
                padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 25),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 10,
                shadowColor: Colors.blue.withOpacity(0.3)
              ),
              child: const Text("السماح بالوصول لجهات الاتصال", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
            ),
          ],
        ),
      );
    }

    return FutureBuilder<List<ContactModel>>(
      future: FirestoreService.getRecentContacts(),
      builder: (context, snap) {
        if (!snap.hasData) return const Center(child: CircularProgressIndicator());
        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: snap.data!.length,
          itemBuilder: (context, i) => Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: ListTile(
              title: Text(snap.data![i].name, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(snap.data![i].phoneNumber, style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.w900)),
            ),
          ),
        );
      },
    );
  }
}