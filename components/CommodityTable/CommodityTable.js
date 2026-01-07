import React from "react";
import styles from "./CommodityTable.module.scss";

const CommodityTable = ({
    commodities,
    getMetalName,
    calculatePrices,
    currencyFormatter,
}) => {
    return (
        <ul className={styles.table_sec}>
            <li>
                <div className={styles.title_sec}>
                    <h3>Commodity</h3>
                    <h3>BID</h3>
                    <h3>ASK</h3>
                </div>
            </li>

            {commodities.map((item, index) => {
                const metalName = getMetalName(item.metal);
                const { bidPrice, askPrice } = calculatePrices(item, metalName);

                return (
                    <li key={index} className={styles.detail_content_sec}>
                        <div className={styles.detail_sec}>
                            <span>
                                {item.purity} {metalName}
                            </span>
                            <span>{currencyFormatter.format(bidPrice)}</span>
                            <span>{currencyFormatter.format(askPrice)}</span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default CommodityTable;
