import React from "react";
import "./HomeBanner.scss";
import { Link } from "react-router-dom";


function HomeBanner({ image, name, title, subtitle }) {
    // Nếu không truyền image thì lấy ảnh mặc định trong public/img/
    const bannerImage = image ? image : "/resources/img/banner1.jpg";

    return (
        <section className="home_banner_area mb-40">
            <div
                className="box-banner"
                style={{
                    backgroundImage: `url(${bannerImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="banner_inner d-flex align-items-center" >
                    <div className="container">
                        <div className="banner_content row">
                            <div className="col-lg-12 text-center">
                                {/* sub heading */}
                                <p className="sub text-uppercase">
                                    {name || "NEW COLLECTION"}
                                </p>

                                {/* main heading */}
                                <h2>
                                    <span>{title || "Show"}</span> Your <br />
                                    Personal <span>Style</span>
                                </h2>

                                {/* subtitle */}
                                <h4>{subtitle || "Hãy đến với cửa hàng chúng tôi"}</h4>

                                {/* button */}
                                <Link className="main_btn mt-40" to="/shop">
                                    Đến cửa hàng ngay
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HomeBanner;
