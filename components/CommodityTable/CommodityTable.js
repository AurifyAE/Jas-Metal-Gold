import React from "react";
import styles from "./CommodityTable.module.scss";
import Image from "next/image";

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
                    <h3>Unit</h3>
                    <h3>BID ( <Image src={'./icons/dirham-icon.svg'} height={300} width={300} alt="" />)</h3>
                    <h3>ASK ( <Image src={'./icons/dirham-icon.svg'} height={300} width={300} alt="" />)</h3>
                </div>
            </li>

            {commodities.map((item, index) => {
                const metalName = getMetalName(item.metal);
                const { bidPrice, askPrice } = calculatePrices(item, metalName);
                console.log('adadasdasd', item);

                return (
                    <li key={index} className={styles.detail_content_sec}>
                        <div className={styles.detail_sec}>
                            <span>
                                {item.purity} {metalName}
                            </span>
                            <span>{item.unit}{item.weight}</span>
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
