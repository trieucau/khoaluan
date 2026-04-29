import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.scss';

const stats = [
  { value: '10K+', label: 'Khách hàng hài lòng' },
  { value: '500+', label: 'Sản phẩm thời trang' },
  { value: '98%', label: 'Đánh giá tích cực' },
  { value: '5+', label: 'Năm kinh nghiệm' },
];

const team = [
  {
    name: 'Phan Thành Triều',
    role: 'Co-Founder & Backend Developer',
    avatar: '/resources/img/team1.jpg',
    desc: 'Chuyên gia về kiến trúc hệ thống và tối ưu hiệu suất backend.',
  },
  {
    name: 'Võ Quang Tuấn Trí',
    role: 'Co-Founder & Frontend Developer',
    avatar: '/resources/img/team2.jpg',
    desc: 'Đam mê thiết kế giao diện hiện đại, trải nghiệm người dùng xuất sắc.',
  },
];

const values = [
  {
    icon: 'fa-solid fa-gem',
    title: 'Chất lượng',
    desc: 'Cam kết chỉ cung cấp sản phẩm chất lượng cao, nguồn gốc rõ ràng.',
    color: '#FF6B9D',
  },
  {
    icon: 'fa-solid fa-heart',
    title: 'Tâm huyết',
    desc: 'Mỗi sản phẩm đều được chọn lọc kỹ càng với sự tâm huyết của đội ngũ.',
    color: '#C44569',
  },
  {
    icon: 'fa-solid fa-bolt',
    title: 'Đổi mới',
    desc: 'Liên tục cập nhật xu hướng thời trang mới nhất từ khắp thế giới.',
    color: '#F8B195',
  },
  {
    icon: 'fa-solid fa-users',
    title: 'Cộng đồng',
    desc: 'Xây dựng cộng đồng yêu thời trang, chia sẻ phong cách sống tích cực.',
    color: '#7C4DFF',
  },
];

function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);

    // Scroll reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page">
      {/* ── HERO SECTION ────────────────────── */}
      <section className="about-hero">
        <div className="about-hero__bg" />
        <div className="container">
          <div className="about-hero__content">
            <span className="about-hero__tag">Câu chuyện của chúng tôi</span>
            <h1 className="about-hero__title">
              Solana — Thời trang <br />
              <em>dành cho bạn</em>
            </h1>
            <p className="about-hero__desc">
              Chúng tôi tin rằng thời trang không chỉ là trang phục — đó là cách bạn
              thể hiện bản thân mỗi ngày. Solana ra đời để giúp bạn tìm thấy phong
              cách riêng với những thiết kế đẹp, chất lượng và phải chăng.
            </p>
            <div className="about-hero__actions">
              <Link to="/shop" className="main_btn">
                Khám phá bộ sưu tập
                <i className="fa-solid fa-arrow-right" />
              </Link>
              <Link to="/blog" className="btn-outline-cta">
                Đọc blog của chúng tôi
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative shapes */}
        <div className="about-hero__circle about-hero__circle--1" />
        <div className="about-hero__circle about-hero__circle--2" />
      </section>

      {/* ── STATS ─────────────────────────── */}
      <section className="about-stats">
        <div className="container">
          <div className="row g-4">
            {stats.map((s, i) => (
              <div key={i} className="col-6 col-lg-3">
                <div className="about-stat-card scroll-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="about-stat-card__value">{s.value}</div>
                  <div className="about-stat-card__label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORY SECTION ─────────────────── */}
      <section className="about-story section_gap">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 scroll-reveal">
              <div className="about-story__img-wrap">
                <img
                  src="/resources/img/banner1.jpg"
                  alt="Câu chuyện Solana"
                  className="about-story__img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="about-story__img-badge">
                  <i className="fa-solid fa-award" />
                  <span>Brand <br />Uy tín</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6 scroll-reveal delay-200">
              <span className="section-header__subtitle">Về chúng tôi</span>
              <h2 className="about-story__title">
                Hành trình xây dựng<br />
                thương hiệu thời trang Việt
              </h2>
              <p className="about-story__text">
                Solana Shop được thành lập bởi hai sinh viên đam mê công nghệ và thời trang.
                Chúng tôi bắt đầu từ mong muốn mang đến trải nghiệm mua sắm thời trang trực tuyến
                tốt nhất cho người Việt — nơi công nghệ và phong cách gặp nhau.
              </p>
              <p className="about-story__text">
                Với nền tảng công nghệ hiện đại, gợi ý sản phẩm thông minh dựa trên AI,
                và đội ngũ chăm sóc khách hàng tận tâm, Solana cam kết mang lại trải nghiệm
                mua sắm mượt mà, thú vị và đáng tin cậy.
              </p>
              <ul className="about-story__checklist">
                <li><i className="fa-solid fa-check" /> Sản phẩm chính hãng 100%</li>
                <li><i className="fa-solid fa-check" /> Giao hàng nhanh trong 24h</li>
                <li><i className="fa-solid fa-check" /> Đổi trả dễ dàng trong 7 ngày</li>
                <li><i className="fa-solid fa-check" /> Thanh toán an toàn đa phương thức</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ────────────────────────── */}
      <section className="about-values section_gap" style={{ background: 'var(--c-bg-alt)' }}>
        <div className="container">
          <div className="section-header scroll-reveal">
            <span className="section-header__subtitle">Giá trị cốt lõi</span>
            <h2 className="section-header__title">Điều chúng tôi tin tưởng</h2>
            <p className="section-header__desc">
              Những giá trị định hướng mọi quyết định của Solana
            </p>
          </div>
          <div className="row g-4">
            {values.map((v, i) => (
              <div key={i} className="col-lg-3 col-md-6">
                <div className="about-value-card scroll-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div
                    className="about-value-card__icon"
                    style={{ background: `${v.color}18`, color: v.color }}
                  >
                    <i className={v.icon} />
                  </div>
                  <h4 className="about-value-card__title">{v.title}</h4>
                  <p className="about-value-card__desc">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ──────────────────────────── */}
      <section className="about-team section_gap">
        <div className="container">
          <div className="section-header scroll-reveal">
            <span className="section-header__subtitle">Đội ngũ sáng lập</span>
            <h2 className="section-header__title">Những người tạo nên Solana</h2>
          </div>
          <div className="row g-4 justify-content-center">
            {team.map((member, i) => (
              <div key={i} className="col-lg-5 col-md-6">
                <div className="about-team-card scroll-reveal" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="about-team-card__avatar">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.style.background = 'var(--grad-primary)';
                      }}
                    />
                    <div className="about-team-card__avatar-fallback">
                      {member.name.charAt(0)}
                    </div>
                  </div>
                  <div className="about-team-card__info">
                    <h4 className="about-team-card__name">{member.name}</h4>
                    <span className="about-team-card__role">{member.role}</span>
                    <p className="about-team-card__desc">{member.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────── */}
      <section className="about-cta">
        <div className="container">
          <div className="about-cta__inner scroll-reveal">
            <h2 className="about-cta__title">Sẵn sàng khám phá Solana?</h2>
            <p className="about-cta__desc">
              Hàng ngàn sản phẩm thời trang đang chờ bạn. Đăng ký ngay để nhận ưu đãi đặc biệt!
            </p>
            <div className="about-cta__actions">
              <Link to="/shop" className="main_btn">
                Mua sắm ngay
                <i className="fa-solid fa-bag-shopping" />
              </Link>
              <Link to="/register" className="btn-outline-cta" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>
                Đăng ký miễn phí
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
