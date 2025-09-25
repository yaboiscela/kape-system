import React from "react";
import Chart from "react-apexcharts";
import { useEffect, useRef } from "react";

export default function DashboardCharts(isMinimized) {

  const hasMounted = useRef(false);

    useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const timeout = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100); 

    return () => clearTimeout(timeout);
  }, [isMinimized]);

  // BAR CHART CONFIG
  const barChartOptions = {
    chart: {
      type: "bar",
      background: "transparent",
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    colors: ["#8d99ae", "#ff595e", "#52b788", "#ffbf69", "#a882dd"],
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 6,
        columnWidth: "45%",
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "#b08968",
    },
    legend: {
      labels: { colors: "#7f5539" },
      show: true,
      position: "top",
    },
    stroke: {
      colors: ["transparent"],
      width: 2,
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "dark",
    },
    xaxis: {
      categories: ["Cappuccino", "Latte", "Mocha", "Americano", "Muffin"],
      labels: { style: { colors: "#7f5539" } },
      axisBorder: { color: "#7f5539" },
    },
    yaxis: {
      title: { text: "Count", style: { color: "#7f5539" } },
      labels: { style: { colors: "#7f5539" } },
    },
    responsive: [
      {
        breakpoint: 768, // tablets
        options: {
          plotOptions: { bar: { columnWidth: "55%" } },
        },
      },
      {
        breakpoint: 480, // mobile
        options: {
          plotOptions: { bar: { columnWidth: "70%" } },
          legend: { position: "bottom" },
        },
      },
    ],
  };

  const barChartSeries = [
    { data: [216, 148, 84, 72, 174], name: "Products" },
  ];

  // AREA CHART CONFIG
  const areaChartOptions = {
    chart: {
      type: "area",
      background: "transparent",
      stacked: false,
      toolbar: { show: false },
    },
    colors: ["#70798c", "#ffbf69"],
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    dataLabels: { enabled: false },
    fill: {
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
        shadeIntensity: 1,
        stops: [0, 100],
        type: "vertical",
      },
      type: "gradient",
    },
    grid: {
      borderColor: "#7f5539",
    },
    legend: {
      labels: { colors: "#7f5539" },
      position: "top",
    },
    markers: {
      size: 6,
      strokeColors: "#7f5539",
      strokeWidth: 3,
    },
    stroke: { curve: "smooth" },
    xaxis: {
      labels: { style: { colors: "#7f5539" } },
      axisBorder: { color: "#7f5539" },
    },
    yaxis: [
      {
        title: { text: "Beverages", style: { color: "#7f5539" } },
        labels: { style: { colors: ["#7f5539"] } },
      },
      {
        opposite: true,
        title: { text: "Desserts", style: { color: "#7f5539" } },
        labels: { style: { colors: ["#7f5539"] } },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      theme: "dark",
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: { position: "bottom" },
          markers: { size: 4 },
        },
      },
      {
        breakpoint: 480,
        options: {
          legend: { position: "bottom" },
          markers: { size: 3 },
        },
      },
    ],
  };

  const areaChartSeries = [
    { name: "Desserts", data: [31, 40, 28, 51, 42, 109, 100] },
    { name: "Beverages", data: [11, 32, 45, 32, 34, 52, 41] },
  ];

  return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full">
    {/* BAR CHART */}
    <div className="bg-white p-4 rounded-2xl shadow-md w-full max-w-full">
        <h2 className="text-xl font-semibold mb-4 text-[#7f5539]">
        Top 5 Products
        </h2>
        <div className="w-full h-[350px]">
        <Chart
            options={barChartOptions}
            series={barChartSeries}
            type="bar"
            width="100%"
            height="100%"
        />
        </div>
    </div>

    {/* AREA CHART */}
    <div className="bg-white p-4 rounded-2xl shadow-md w-full max-w-full">
        <h2 className="text-xl font-semibold mb-4 text-[#7f5539]">
        Beverages & Desserts
        </h2>
        <div className="w-full h-[350px]">
        <Chart
            options={areaChartOptions}
            series={areaChartSeries}
            type="area"
            width="100%"
            height="100%"
        />
        </div>
    </div>
    </div>

  );
}
