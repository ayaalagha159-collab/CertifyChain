// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
  ✅ عقد ذكي لتوثيق الشهادات
  المشروع: CertifyChain
  الهدف: تخزين شهادات الطلاب على البلوكشين
*/

contract CertifyChain {
    // ✅ هيكل بيانات الشهادة
    struct Certificate {
        uint id;               // رقم الشهادة
        string title;          // اسم الشهادة
        string studentName;    // اسم الطالب
        string issueDate;      // تاريخ الإصدار
        address issuer;        // الجهة المصدّرة
        bool valid;            // حالة الشهادة
    }

    // ✅ عدّاد لتوليد أرقام الشهادات
    uint public certificateCount = 0;

    // ✅ قائمة لتخزين الشهادات باستخدام رقمها كمفتاح
    mapping(uint => Certificate) public certificates;

    // ✅ حدث (Event) عند إصدار شهادة جديدة
    event CertificateIssued(uint id, string title, string studentName, string issueDate, address issuer);

    // ✅ إصدار شهادة جديدة
    function issueCertificate(string memory _title, string memory _studentName, string memory _issueDate) public {
        certificateCount++;
        certificates[certificateCount] = Certificate(
            certificateCount,
            _title,
            _studentName,
            _issueDate,
            msg.sender,
            true
        );

        emit CertificateIssued(certificateCount, _title, _studentName, _issueDate, msg.sender);
    }

    // ✅ التحقق من شهادة
    function verifyCertificate(uint _id) public view returns (bool, string memory, string memory, string memory, address) {
        Certificate memory cert = certificates[_id];
        return (cert.valid, cert.title, cert.studentName, cert.issueDate, cert.issuer);
    }

    // ✅ إلغاء شهادة (من الجهة المصدّرة فقط)
    function revokeCertificate(uint _id) public {
        Certificate storage cert = certificates[_id];
        require(cert.issuer == msg.sender, "غير مصرح لك بإلغاء هذه الشهادة");
        cert.valid = false;
    }

    // ✅ التحقق من عدد الشهادات الكلي
    function getTotalCertificates() public view returns (uint) {
        return certificateCount;
    }
}
