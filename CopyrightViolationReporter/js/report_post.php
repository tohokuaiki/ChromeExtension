<?php
header('Content-Type: application/json');
if (strcasecmp($_SERVER['REQUEST_METHOD'], "post") === 0){
    if (isset($_POST['id']) && isset($_POST['url'])){
        $line = sprintf("%s\t%s\t%s\t%s\n",
                        date('Y-m-d H:i:s'),
                        $_SERVER['REMOTE_ADDR'],
                        stripCtrlCode($_POST['id']),
                        stripCtrlCode($_POST['url']));
        if (strlen($line) < 1000){
            $file = sprintf('%s/rep-data/data-%s.log', dirname(__FILE__), date('Ymd'));
            if (!file_exists($file)){
                touch($file);
                chmod($file, 0666);
            }
            if ($fp = fopen($file, 'a+')){
                fputs($fp, $line);
                fclose();
            }
        }
    }
}

/**
 * @brief 制御コードを削除する
 * @param 
 * @retval
 */
function stripCtrlCode($string)
{
    $ctrl_code = array(
        "00", // NULl（ヌル）
        "01", // Start Of Heading（ヘッダ開始）
        "02", // Start of TeXt（テキスト開始）
        "03", // End of TeXt（テキスト終了）
        "04", // End Of Transmission（転送終了）
        "05", // ENQuiry（問合せ）
        "06", // ACKnowledge（肯定応答）
        "07", // BELl（ベル）
        "08", // Back Space（後退）
        /*    "09", // Horizontal Tabulation（水平タブ） */
        /*    "0A", // Line Feed（改行）*/
        "0B", // Vertical Tabulation（垂直タブ）
        "0C", // Form Feed（改ページ）
        /*    "0D", // Carriage Return（復帰）*/
        "0E", // Shift Out（シフトアウト）
        "0F", // Shift In（シフトイン）
        "10", // Data Link Escape（伝送制御拡張）
        "11", // Device Control 1（装置制御1）
        "12", // Device Control 2（装置制御2）
        "13", // Device Control 3（装置制御3）
        "14", // Device Control 4（装置制御4）
        "15", // Negative AcKnowledge（否定応答）
        "16", // SYNchronous idle（同期信号）
        "17", // End of Transmission Block（転送ブロック終了）
        "18", // CANcel（取消）
        "19", // End of Medium（媒体終端）
        "1A", // SUBstitute（置換）
        "1B", // ESCape（拡張）
        "1C", // File Separator（ファイル分離）
        "1D", // Group Separator（グループ分離）
        "1E", // Record Separator（レコード分離）
        "1F", // Unit Separator（ユニット分離）
        );

    $code_array = array();
    foreach ($ctrl_code as $code){
        $code_array[] = ITT_Util::hex2bin($code);
    }

    return str_replace($code_array, "", $string);
}

?>
{result: 'OK'}
