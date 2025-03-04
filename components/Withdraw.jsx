import { useNotification } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { Button, Input, Typography } from "@web3uikit/core";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import reserveContract from "../contracts/Reserve.json";

export default function Withdraw(props) {
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("0");
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const dispatch = useNotification();

  const { runContractFunction: withdraw } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "withdraw",
    params: {
      asset: addresses[props.asset].address,
      amount: amount,
    },
  });

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses[props.asset].address,
    },
  });

  const { runContractFunction: getMaximumWithdrawalAmount } = useWeb3Contract();

  async function updateMaxAmount() {
    const reserveAddress = (await getReserveAddress()).toString();

    const maxWithdrawalOptions = {
      abi: reserveContract.abi,
      contractAddress: reserveAddress,
      functionName: "getMaximumWithdrawalAmount",
      params: {
        to: account,
      },
    };

    const updatedMaxAmount = (
      await getMaximumWithdrawalAmount({
        params: maxWithdrawalOptions,
      })
    ).toString();

    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  //Run once
  useEffect(() => {
    if (isWeb3Enabled && props.asset) {
      updateMaxAmount();
    }
  }, [isWeb3Enabled, props.asset]);

  const handleWithdrawalSuccess = async function () {
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Withdrawal Successful! ",
      position: "topR",
    });
  };

  function handleInputChange(e) {
    if (e.target.value != "") {
      setAmount(
        parseUnits(e.target.value, addresses[props.asset].decimals).toString()
      );
    } else {
      setAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Maximum withdrawal amount</Typography>
          <Typography variant="body16">
            {formatUnits(maxAmount, addresses[props.asset].decimals) +
              " " +
              props.asset}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center mx-8 mt-12 mb-2">
        <Input
          labelBgColor="rgb(241, 242, 251)"
          label="Amount"
          type="number"
          step="any"
          value={amount && formatUnits(amount, addresses[props.asset].decimals)}
          validation={{
            numberMax: Number(
              formatUnits(maxAmount, addresses[props.asset].decimals)
            ),
            numberMin: 0,
          }}
          onChange={handleInputChange}
        />
      </div>
      <div className="flex flex-row justify-center">
        <div className="flex flex-col">
          <Button
            onClick={() =>
              setAmount(BigNumber.from(maxAmount).mul(2500).div(10000))
            }
            text="25%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() =>
              setAmount(BigNumber.from(maxAmount).mul(5000).div(10000))
            }
            text="50%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() =>
              setAmount(BigNumber.from(maxAmount).mul(7500).div(10000))
            }
            text="75%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() => setAmount(maxAmount)}
            text="100%"
            theme="outline"
          />
        </div>
      </div>
      <div className="mt-16 mb-8">
        <Button
          text="Withdraw"
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          loadingText=""
          isLoading={withdrawalLoading}
          onClick={async function () {
            if (BigNumber.from(amount).lte(BigNumber.from(maxAmount))) {
              setWithdrawalLoading(true);
              await withdraw({
                onComplete: () => setWithdrawalLoading(false),
                onSuccess: handleWithdrawalSuccess,
                onError: (error) => console.log(error),
              });
            } else {
              dispatch({
                type: "error",
                message: "Amount is bigger than max permited withdrawal",
                title: "Error",
                position: "topR",
              });
            }
          }}
        />
      </div>
    </div>
  );
}
