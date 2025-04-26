**Giai đoạn 1: Phân tích và Chuẩn bị**

1.  **Nghiên cứu kỹ lưỡng thiết kế (hình ảnh):**

    - **Xác định các khối giao diện lớn:** Nhìn tổng thể xem giao diện được chia thành các phần chính nào (ví dụ: Header, Footer, Sidebar, Nội dung chính).
    - **Tìm các yếu tố lặp lại:** Chú ý đến các thành phần xuất hiện nhiều lần với cấu trúc giống nhau (ví dụ: nút bấm, thẻ sản phẩm, mục danh sách, avatar người dùng). Đây là những ứng viên sáng giá để tạo thành "component" tái sử dụng.
    - **Xác định các biến thể:** Một nút bấm có thể có nhiều trạng thái (mặc định, hover, active, disabled) hoặc kích thước (nhỏ, vừa, lớn). Một thẻ sản phẩm có thể có hoặc không có nhãn giảm giá. Ghi nhận lại những điểm này.
    - **Phân tích Bố cục (Layout):** Giao diện được sắp xếp theo cột, hàng như thế nào? Sử dụng Grid hay Flexbox sẽ phù hợp?
    - **Hệ thống thiết kế (Design System - nếu có, hoặc tự suy luận):** Xác định các yếu tố cơ bản như bảng màu (primary, secondary, success, error...), kiểu chữ (font family, size, weight), khoảng cách (spacing), bo góc (border-radius). Việc này giúp đảm bảo tính nhất quán.

2.  **Chọn Công cụ và Thiết lập Môi trường:**
    - **Framework/Library:** Bạn đã chọn Next.js (bao gồm React), đây là lựa chọn rất tốt.
    - **Quản lý Gói:** npm hoặc yarn.
    - **Trình soạn thảo Code:** VS Code (rất phổ biến và có nhiều tiện ích hỗ trợ).
    - **Khởi tạo dự án:** Dùng lệnh `npx create-next-app@latest ten-du-an-cua-ban` (Có thể chọn dùng TypeScript nếu bạn muốn code chặt chẽ hơn).
    - **Quản lý phiên bản:** Git (luôn khởi tạo Git ngay từ đầu).

**Giai đoạn 2: Xây dựng Giao diện Tĩnh**

Đây là giai đoạn tập trung biến hình ảnh thành code HTML/CSS (thông qua JSX và các phương pháp styling trong React/Next.js).

3.  **Phân chia thành Components (Đây là bước cốt lõi):**

    - **Tại sao phải chia?** Giống như trong backend bạn chia code thành các hàm, class, module để dễ quản lý, tái sử dụng và bảo trì, thì trong frontend, "component" chính là đơn vị cơ bản để làm điều đó. Một component đóng gói một phần giao diện và logic liên quan (nếu có).
    - **Chia như thế nào?**
      - **Top-down (Từ trên xuống):** Bắt đầu từ các khối lớn nhất bạn xác định ở bước 1 (ví dụ: `Layout`, `Header`, `Footer`, `ProductListPage`). Sau đó, chia nhỏ từng khối lớn này thành các component con (ví dụ: `Header` có thể chứa `Logo`, `NavigationBar`, `SearchInput`, `UserProfile`).
      - **Bottom-up (Từ dưới lên / Atomic Design - แนวคิด phổ biến):** Xác định các "nguyên tử" nhỏ nhất, không thể chia nhỏ hơn và có thể tái sử dụng (ví dụ: `Button`, `Input`, `Icon`, `Typography`). Sau đó kết hợp chúng thành "phân tử" lớn hơn (ví dụ: `SearchForm` gồm `Input` và `Button`). Tiếp tục kết hợp thành "sinh vật" (organisms) phức tạp hơn (ví dụ: `ProductCard` gồm `Image`, `Typography`, `Button`). Cuối cùng là "template" và "page".
      - **Nguyên tắc trách nhiệm đơn lẻ (Single Responsibility Principle):** Mỗi component nên làm tốt _một_ việc. Ví dụ: Component `Button` chỉ nên lo việc hiển thị và xử lý sự kiện click của một nút bấm, không nên chứa logic gọi API phức tạp bên trong.
    - **Ví dụ:** Từ hình ảnh một trang danh sách sản phẩm:
      - **Pages:** `ProductListPage`
      - **Layout Components:** `MainLayout` (chứa Header, Footer chung)
      - **Feature Components:** `ProductGrid` (hiển thị lưới sản phẩm), `FilterSidebar`
      - **UI Components (Tái sử dụng cao):** `ProductCard`, `Button`, `Checkbox`, `SelectDropdown`, `Pagination`
    - **Đặt tên:** Dùng quy tắc PascalCase (ví dụ: `UserProfileCard`). Tên cần rõ ràng, mô tả đúng chức năng/nội dung của component.

4.  **Cấu trúc Thư mục Dự án:**

    - Next.js có cấu trúc cơ bản (ví dụ: `pages` hoặc `app`, `public`, `styles`).
    - Tạo thư mục `components` ở gốc dự án.
    - Bên trong `components`, bạn có thể tổ chức thêm:
      - `ui/`: Chứa các component giao diện cơ bản, tái sử dụng cao (Button, Input, Card, Modal...).
      - `layout/`: Chứa các component về bố cục (Header, Footer, Sidebar, Layout...).
      - `features/` (hoặc theo tên trang/chức năng): Chứa các component đặc thù cho một tính năng nào đó (ví dụ: `features/products/ProductCard`, `features/auth/LoginForm`).
    - **Mục tiêu:** Dễ tìm kiếm, dễ quản lý và dễ hình dung cấu trúc ứng dụng.

5.  **Viết code JSX và Styling cho từng Component:**

    - **Bắt đầu từ component nhỏ nhất:** Viết cấu trúc JSX (HTML trong JavaScript) cho các component đơn giản như `Button`, `Input` trước.
    - **Styling:** Đây là lúc áp dụng CSS. Có nhiều cách trong React/Next.js:
      - **CSS Modules (`.module.css`):** Cách phổ biến, CSS được đóng gói cục bộ cho từng component, tránh xung đột tên class. Next.js hỗ trợ sẵn.
      - **Tailwind CSS:** Framework utility-first rất mạnh mẽ và được ưa chuộng. Giúp tạo giao diện nhanh chóng bằng cách áp dụng các class tiện ích trực tiếp vào JSX. Rất tốt cho việc duy trì sự nhất quán. Cần cài đặt và cấu hình.
      - **Styled Components / Emotion (CSS-in-JS):** Viết CSS ngay trong file JavaScript/TypeScript. Linh hoạt nhưng có thể hơi khác lạ nếu bạn quen với CSS truyền thống.
      - **Global CSS (`styles/globals.css`):** Dùng cho các style tổng thể như reset CSS, font chữ mặc định, biến màu CSS.
    - **Sử dụng Semantic HTML:** Dùng các thẻ HTML đúng ngữ nghĩa (`<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`, `<button>`) để tốt cho SEO và Accessibility (Khả năng truy cập).
    - **Áp dụng Design System:** Sử dụng các biến (CSS variables hoặc biến trong Tailwind/Styled Components) cho màu sắc, font chữ, khoảng cách đã xác định ở bước 1. Điều này cực kỳ quan trọng để dễ dàng thay đổi và bảo trì sau này.

6.  **Lắp ráp các Components thành Trang hoàn chỉnh:**
    - Trong các file trang (ví dụ: `pages/products.js` hoặc `app/products/page.js`), import các component lớn đã tạo (ví dụ: `MainLayout`, `ProductGrid`, `FilterSidebar`).
    - Sắp xếp chúng theo đúng bố cục của thiết kế. Sử dụng CSS Grid hoặc Flexbox để kiểm soát layout tổng thể của trang.

**Giai đoạn 3: Tinh chỉnh và Tối ưu**

7.  **Responsive Design:**

    - Đảm bảo giao diện hiển thị tốt trên các kích thước màn hình khác nhau (mobile, tablet, desktop).
    - Sử dụng Media Queries (trong CSS/CSS Modules) hoặc các tiền tố responsive của Tailwind (ví dụ: `md:`, `lg:`).

8.  **Accessibility (a11y):**

    - Đảm bảo người dùng khuyết tật có thể sử dụng trang web (ví dụ: dùng đúng thẻ HTML, thêm thuộc tính `alt` cho ảnh, đảm bảo đủ độ tương phản màu sắc, hỗ trợ điều hướng bằng bàn phím).

9.  **Tối ưu hóa:**

    - **Hình ảnh:** Sử dụng component `<Image>` của Next.js để tối ưu hóa hình ảnh tự động (lazy loading, định dạng phù hợp).
    - **Code Splitting:** Next.js tự động thực hiện việc này ở cấp độ trang, giúp tải trang nhanh hơn.
    - **Font:** Tối ưu cách tải font chữ.

10. **Kiểm tra và Refactor:**
    - Kiểm tra lại giao diện trên nhiều trình duyệt.
    - Xem lại code, tìm cơ hội để tái cấu trúc (refactor) cho gọn gàng hơn, tái sử dụng tốt hơn. Có component nào quá lớn, nên tách nhỏ ra không? Có đoạn code nào lặp lại có thể tạo thành component/hook riêng không?

**Best Practices cần nhớ:**

- **Component hóa triệt để:** Phân chia UI thành các component nhỏ, tái sử dụng được.
- **Đặt tên rõ ràng:** Cho file, component, biến, hàm.
- **Cấu trúc thư mục hợp lý:** Dễ tìm kiếm và bảo trì.
- **Styling nhất quán:** Sử dụng biến/token cho màu sắc, font, spacing.
- **Viết code sạch:** Format code (dùng Prettier), kiểm tra lỗi (dùng ESLint).
- **Semantic HTML và Accessibility.**
- **Quản lý State (Khi có tương tác):** Ban đầu bạn chỉ làm giao diện tĩnh, nhưng khi cần xử lý dữ liệu động, sự kiện người dùng, bạn sẽ cần học về `useState`, `useEffect` (React Hooks) và có thể là các thư viện quản lý state phức tạp hơn (Zustand, Redux Toolkit) nếu ứng dụng lớn.
- **Luôn dùng Git.**

**Lời khuyên cho người mới bắt đầu từ Backend:**

- **Đừng quá lo lắng về mọi thứ cùng lúc:** Bắt đầu bằng việc dựng giao diện tĩnh (JSX + CSS). Hiểu rõ cách chia component và styling là nền tảng quan trọng nhất.
- **Tập trung vào "Component Thinking":** Luôn nghĩ xem phần UI nào có thể tách ra thành một đơn vị độc lập, tái sử dụng được.
- **Học CSS Layout:** Nắm vững Flexbox và Grid là cực kỳ cần thiết để sắp xếp các component trên trang.
- **Thực hành nhiều:** Cách tốt nhất để học là làm. Bắt đầu với component nhỏ, rồi đến trang đơn giản, dần dần tăng độ phức tạp.
