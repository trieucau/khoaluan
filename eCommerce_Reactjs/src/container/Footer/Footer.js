import React from 'react';

function Footer() {
  return (
    <footer className="footer-area section_gap bg-dark text-light py-5">
      <div className="container">
        <div className="row">
          {/* Top Products */}
          <div className="col-lg-3 col-md-6 mb-4 single-footer-widget">
            <h4 className="text-uppercase mb-3">Top Products</h4>
            <ul className="list-unstyled">
              <li><a className="text-light text-decoration-none" href="#">Managed Website</a></li>
              <li><a className="text-light text-decoration-none" href="#">Manage Reputation</a></li>
              <li><a className="text-light text-decoration-none" href="#">Power Tools</a></li>
              <li><a className="text-light text-decoration-none" href="#">Marketing Service</a></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="col-lg-3 col-md-6 mb-4 single-footer-widget">
            <h4 className="text-uppercase mb-3">Quick Links</h4>
            <ul className="list-unstyled">
              <li><a className="text-light text-decoration-none" href="#">Jobs</a></li>
              <li><a className="text-light text-decoration-none" href="#">Brand Assets</a></li>
              <li><a className="text-light text-decoration-none" href="#">Investor Relations</a></li>
              <li><a className="text-light text-decoration-none" href="#">Terms of Service</a></li>
            </ul>
          </div>

          {/* Features */}
          <div className="col-lg-3 col-md-6 mb-4 single-footer-widget">
            <h4 className="text-uppercase mb-3">Features</h4>
            <ul className="list-unstyled">
              <li><a className="text-light text-decoration-none" href="#">Jobs</a></li>
              <li><a className="text-light text-decoration-none" href="#">Brand Assets</a></li>
              <li><a className="text-light text-decoration-none" href="#">Investor Relations</a></li>
              <li><a className="text-light text-decoration-none" href="#">Terms of Service</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-lg-3 col-md-6 mb-4 single-footer-widget">
            <h4 className="text-uppercase mb-3">Resources</h4>
            <ul className="list-unstyled">
              <li><a className="text-light text-decoration-none" href="#">Guides</a></li>
              <li><a className="text-light text-decoration-none" href="#">Research</a></li>
              <li><a className="text-light text-decoration-none" href="#">Experts</a></li>
              <li><a className="text-light text-decoration-none" href="#">Agencies</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom row mt-4">
          <p className="footer-text m-0 col-lg-12 text-center">
            Bản quyền ©2025 Đồ án tốt nghiệp của <b>Thân Quốc Thắng</b> và <b>Nguyễn Thành Tâm</b> ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
