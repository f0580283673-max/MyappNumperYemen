import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/firestore_service.dart';
import '../models/contact_model.dart';
import 'package:intl/intl.dart';

class SearchNumberScreen extends StatefulWidget {
  const SearchNumberScreen({super.key});
  @override
  State<SearchNumberScreen> createState() => _SearchNumberScreenState();
}

class _SearchNumberScreenState extends State<SearchNumberScreen> {
  final TextEditingController _controller = TextEditingController();
  List<ContactModel> _results = [];
  bool _isLoading = false;

  void _search() async {
    String query = _controller.text.trim();
    if (query.isEmpty) return;

    if (query.length != 9) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('رقم الهاتف ناقص، يجب أن يكون 9 أرقام'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    final results = await FirestoreService.searchByNumber(query);
    setState(() {
      _results = results;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8FAFC),
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('البحث بالهاتف', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w900, fontSize: 12)),
          const SizedBox(height: 12),
          Container(
            height: 72,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 8))],
            ),
            child: Row(
              children: [
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _search,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2196F3),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    elevation: 0,
                  ),
                  child: const Text('بحث', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                ),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    textAlign: TextAlign.right,
                    keyboardType: TextInputType.phone,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    maxLength: 9,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, letterSpacing: 1.5),
                    decoration: const InputDecoration(
                      hintText: 'أدخل الرقم...',
                      hintStyle: TextStyle(fontWeight: FontWeight.normal, color: Colors.grey, fontSize: 16),
                      border: InputBorder.none,
                      counterText: "",
                      contentPadding: EdgeInsets.symmetric(horizontal: 20),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          if (_isLoading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else
            Expanded(
              child: ListView.separated(
                itemCount: _results.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final item = _results[index];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.grey.shade100),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(child: Text('${index + 1}', style: const TextStyle(color: Color(0xFF2196F3), fontWeight: FontWeight.w900))),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Text(DateFormat('dd/MM/yyyy').format(item.timestamp ?? DateTime.now()), style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                                  const SizedBox(width: 8),
                                  const CircleAvatar(radius: 2, backgroundColor: Colors.blue),
                                  const SizedBox(width: 8),
                                  Text(item.phoneNumber, style: const TextStyle(color: Color(0xFF2196F3), fontWeight: FontWeight.w900, fontSize: 12)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(onPressed: () {}, icon: const Icon(Icons.more_vert_rounded, color: Colors.grey)),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}