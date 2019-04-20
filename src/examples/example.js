if (!isNil(deliveryPromise.promptDate)){  
   switch (deliveryPromise.promptDate.type)   {  
      case DELIVERY_TYPE_TODAY:
        output.addText(MessageFormat.format(DELIVERY_INFO_TODAY,
        params.readableTitle, orderAmount)); 
        break; 
      case DELIVERY_TYPE_TOMORROW:
        output.addText(MessageFormat.format(DELIVERY_INFO_TOMORROW,
            params.readableTitle, orderAmount)); 
      break; 
      default:
        var formattedDateSSML = MessageFormat.format(DATE_SSML,
            deliveryPromise.promptDate.ssmlDate); 
            output.addSsml(MessageFormat.format(DELIVERY_INFO_DISTANT,
              params.readableTitle,
              orderAmount,
              formattedDateSSML)); 
        break;
   }
}else if (!isNil(deliveryPromise.endDate)){  
   switch(deliveryPromise.endDate)   {  
      case DELIVERY_TYPE_TODAY:
        output.addText(MessageFormat.format(DELIVERY_INFO_TODAY,
          params.readableTitle,
          orderAmount)); 
        break; 
      case DELIVERY_TYPE_TOMORROW:
        output.addText(MessageFormat.format(DELIVERY_INFO_TOMORROW,
          params.readableTitle,
          orderAmount)); 
        break; 
    default:
      output.addText(MessageFormat.format(DELIVERY_INFO_DISTANT,
          params.readableTitle,
          orderAmount,
          deliveryPromise.endDate)); 
      break;
   }
}